// schedule data which is then sent to the API
const scheduleData = {
  owner_user_id: null,
  invited_user_id: null,
  appointment_time: new Date(),
  duration: "PT30M", // hardcoded on server anyway
};

// summary model
const scheduleSummary = {
  dateTime: new Date(),
  duration: "30 min",
  name: "",
};

let popupClosedCallback = null;

let writeAccessRequestCount = 0;
const writeAccessRequestCallback = (granted) => {
  if (granted || writeAccessRequestCount == 1) {
    Telegram.WebApp.close();
    return;
  }

  writeAccessRequestCount++;
  Telegram.WebApp.requestWriteAccess(writeAccessRequestCallback);
};

function onHourChanged(event, availability) {
  const hour = event.target.value;
  const scheduleMinuteSelector = document.getElementById(
    "scheduleMinuteSelector"
  );
  scheduleMinuteSelector.innerHTML = "";

  const minutes = availability[hour];
  for (const minute of minutes) {
    const option = document.createElement("option");
    option.value = minute;
    option.innerText = `${minute}`.padStart(2, "0") + " min";
    scheduleMinuteSelector.appendChild(option);
  }

  onScheduleDataChanged({ hour: +hour, minute: +minutes[0] });
}

function onScheduleDataChanged(newData) {
  if (newData.hasOwnProperty("hour")) {
    scheduleData.appointment_time.setUTCHours(newData["hour"]);
    scheduleSummary.dateTime.setUTCHours(newData["hour"]);
  }

  if (newData.hasOwnProperty("minute")) {
    scheduleData.appointment_time.setUTCMinutes(newData["minute"]);
    scheduleSummary.dateTime.setUTCMinutes(newData["minute"]);
  }

  if (newData.hasOwnProperty("date")) {
    scheduleData.appointment_time.setFullYear(newData["date"].getFullYear());
    scheduleSummary.dateTime.setFullYear(newData["date"].getFullYear());

    scheduleData.appointment_time.setMonth(newData["date"].getMonth());
    scheduleSummary.dateTime.setMonth(newData["date"].getMonth());

    scheduleData.appointment_time.setDate(newData["date"].getDate());
    scheduleSummary.dateTime.setDate(newData["date"].getDate());

    scheduleData.appointment_time.setSeconds(0, 0);
    scheduleSummary.dateTime.setSeconds(0, 0);
  }

  if (newData.hasOwnProperty("duration")) {
    scheduleData.duration = newData["duration"];
  }

  if (newData.hasOwnProperty("name")) {
    scheduleSummary.name = newData["name"];
  }

  refreshSummary();
}

async function onScheduleConfirmed() {
  Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
  Telegram.WebApp.MainButton.setText("Scheduling...");
  Telegram.WebApp.MainButton.showProgress();

  const response = await createEvent(scheduleData);

  if (!response.success) {
    return;
  }

  Telegram.WebApp.MainButton.hide();
  Telegram.WebApp.MainButton.hideProgress();
  Telegram.WebApp.HapticFeedback.notificationOccurred("success");
  Telegram.WebApp.showPopup({
    title: "Call scheduled!",
    message: "You will be notified in 20 and 10 minutes before the call",
    buttons: [
      {
        id: "ok",
        type: "ok",
      },
    ],
  });

  popupClosedCallback = () => {
    if (response.data.was_sent) {
      Telegram.WebApp.close();
      return;
    }

    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.offEvent("popupClosed", popupClosedCallback);
    Telegram.WebApp.showPopup({
      title: "Oops!",
      message:
        "Seems like you blocked the @CallegramBot from messaging you. Please unblock it to receive reminders.",
      buttons: [
        {
          id: "ok",
          type: "ok",
        },
      ],
    });
    Telegram.WebApp.onEvent("popupClosed", () => {
      Telegram.WebApp.requestWriteAccess(writeAccessRequestCallback);
    });
  };
  Telegram.WebApp.onEvent("popupClosed", popupClosedCallback);
}

async function onDayClicked(event) {
  Telegram.WebApp.HapticFeedback.selectionChanged();
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }

  const element = event.target;
  element.classList.add("selected");
  const selectedDate = new Date(element.getAttribute("data-date"));
  blockSection(2);
  blockSection(3);
  const availability = await getDayAvailability(
    selectedDate,
    scheduleData.owner_user_id
  );
  unblockSection(2);
  unblockSection(3);

  // check if last available slot is before current time (in UTC) and selected date is today
  const today = new Date();
  const hours = Object.keys(availability);
  const lastHour = hours[hours.length - 1];
  const minutes = availability[lastHour];
  const lastMinute = minutes[minutes.length - 1];
  const lastAvailableDate = new Date(selectedDate);

  lastAvailableDate.setUTCHours(lastHour, lastMinute, 0, 0);

  if (today.getTime() > lastAvailableDate.getTime()) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
    Telegram.WebApp.showAlert(
      "No available time slots, please select another day"
    );
    hideSection(3);
    hideSection(2);
    Telegram.WebApp.MainButton.hide();
    return;
  }

  const [
    selectedHour, // first available hour
    selectedMinute, // first available minute
  ] = populateTimeSlots(availability, selectedDate);

  onScheduleDataChanged({
    date: selectedDate,
    hour: selectedHour,
    minute: selectedMinute,
  });

  showSection(2);
  Telegram.WebApp.MainButton.show();
  Telegram.WebApp.MainButton.setText("Yes, schedule it!");
  Telegram.WebApp.MainButton.onClick(() => {
    if (Telegram.WebApp.MainButton.isActive) {
      onScheduleConfirmed().then(() => {});
    }
  });
  setTimeout(() => {
    showSection(3);
  }, 300);
}

async function main() {
  Telegram.WebApp.expand();

  const authData = await authUser();
  if (!authData) {
    return;
  }

  const initData = getInitData();
  const ownerUserId = initData.start_param.split("_")[1];
  const ownerInfo = await getOwnerAppointmentInfo(ownerUserId);
  if (!ownerInfo) {
    return;
  }

  stopLoading();

  Telegram.WebApp.enableClosingConfirmation();
  onScheduleDataChanged({ name: ownerInfo.name });

  scheduleData.invited_user_id = getUser().id;
  scheduleData.owner_user_id = ownerInfo.id;

  const scheduleOwnerNameEl = document.getElementById("scheduleOwnerName");
  scheduleOwnerNameEl.innerText = ownerInfo.name;

  refreshDayAvailability(ownerInfo.schedule.windows);

  const weekDayElements = document.getElementsByClassName("weekDay");
  for (const weekDayElement of weekDayElements) {
    if (weekDayElement.classList.contains("unavailable")) {
      continue;
    }

    weekDayElement.addEventListener("click", (event) => {
      onDayClicked(event).then(() => {});
    });
  }

  showSection(1);
}
