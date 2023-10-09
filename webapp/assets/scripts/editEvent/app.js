let calendarEvent = null;

// model to send to the API
const scheduleData = {
  appointment_time: new Date(),
  duration: "PT30M", // hardcoded on server anyway
};

// summary data holder
const scheduleSummary = {
  dateTime: new Date(),
  duration: "30 min",
  name: "",
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
    option.innerText = `${minute}`.padStart(2, "0") + "min";
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
    scheduleData.appointment_time.setUTCFullYear(
      newData["date"].getUTCFullYear()
    );
    scheduleSummary.dateTime.setUTCFullYear(newData["date"].getUTCFullYear());

    scheduleData.appointment_time.setUTCMonth(newData["date"].getUTCMonth());
    scheduleSummary.dateTime.setUTCMonth(newData["date"].getUTCMonth());

    scheduleData.appointment_time.setUTCDate(newData["date"].getUTCDate());
    scheduleSummary.dateTime.setUTCDate(newData["date"].getUTCDate());

    scheduleData.appointment_time.setUTCSeconds(0, 0);
    scheduleSummary.dateTime.setUTCSeconds(0, 0);
  }

  if (newData.hasOwnProperty("duration")) {
    scheduleData.duration = newData["duration"];
  }

  if (newData.hasOwnProperty("name")) {
    scheduleSummary.name = newData["name"];
  }

  refreshSummary();
}

async function onEditConfirmed() {
  Telegram.WebApp.MainButton.setText("Editing...");
  Telegram.WebApp.MainButton.showProgress();

  const response = await editEvent(calendarEvent.id, scheduleData);

  if (!response) {
    return;
  }

  Telegram.WebApp.MainButton.hide();
  Telegram.WebApp.MainButton.hideProgress();
  Telegram.WebApp.HapticFeedback.notificationOccurred("success");
  Telegram.WebApp.onEvent("popupClosed", () => {
    Telegram.WebApp.disableClosingConfirmation();
    Telegram.WebApp.BackButton.hide();
    window.location.href = "/";
  });
  Telegram.WebApp.showPopup({
    title: "Call edited!",
    message: "You will be notified in 20 and 10 minutes before the call",
    buttons: [
      {
        id: "ok",
        type: "ok",
      },
    ],
  });
}

async function onDayClicked(element, initialTime = null) {
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }

  element.classList.add("selected");
  const selectedDate = new Date(element.getAttribute("data-date"));
  blockSection(2);
  blockSection(3);
  const availability = await getDayAvailability(
    selectedDate,
    calendarEvent.owner_user_id
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
    Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    Telegram.WebApp.showAlert(
      "No available time slots, please select another day"
    );
    hideSection(3);
    hideSection(2);
    Telegram.WebApp.MainButton.hide();
    return;
  }

  let [
    selectedHour, // first available hour
    selectedMinute, // first available minute
  ] = populateTimeSlots(availability, selectedDate);

  if (initialTime) {
    const timezoneOffset = new Date().getTimezoneOffset();
    selectedHour = initialTime.hour;
    selectedMinute = initialTime.minute;

    console.log(selectedHour, selectedMinute);
    console.log(timezoneOffset);

    const scheduleHourSelector = document.getElementById(
      "scheduleHourSelector"
    );
    scheduleHourSelector.value = selectedHour;

    const scheduleMinuteSelector = document.getElementById(
      "scheduleMinuteSelector"
    );
    scheduleMinuteSelector.value = selectedMinute;
  }

  onScheduleDataChanged({
    date: selectedDate,
    hour: selectedHour,
    minute: selectedMinute,
  });
  showSection(2);
  setTimeout(() => {
    showSection(3);
    Telegram.WebApp.MainButton.show();
    Telegram.WebApp.MainButton.setText("Yes, edit it!");
    Telegram.WebApp.MainButton.onClick(() => {
      if (Telegram.WebApp.MainButton.isActive) {
        onEditConfirmed().then(() => {});
      }
    });
  }, 100);
}

async function main() {
  Telegram.WebApp.expand();

  const authData = await authUser();
  if (!authData) {
    return;
  }

  Telegram.WebApp.enableClosingConfirmation();
  Telegram.WebApp.BackButton.onClick(() => {
    Telegram.WebApp.disableClosingConfirmation();
    Telegram.WebApp.BackButton.hide();
    window.location.href = "/eventDetails?eventId=" + calendarEvent.id;
  });

  const eventId = new URLSearchParams(window.location.search).get("eventId");
  calendarEvent = await getEventDetails(eventId);
  if (!calendarEvent) {
    return;
  }

  const ownerInfo = await getOwnerAppointmentInfo(calendarEvent.owner_user_id);
  if (!ownerInfo) {
    return;
  }

  const scheduleOwnerName = document.getElementById("scheduleOwnerName");
  scheduleOwnerName.innerText = ownerInfo.name;

  refreshDayAvailability(ownerInfo.schedule.windows);

  const eventDate = new Date(calendarEvent.appointment_time);
  const cleanEventDate = new Date(calendarEvent.appointment_time); // with unmodified hours
  const timezoneOffset = new Date().getTimezoneOffset();
  const weekDayElements = document.getElementsByClassName("weekDay");
  for (const weekDayElement of weekDayElements) {
    const weekDayDate = new Date(weekDayElement.getAttribute("data-date"));

    weekDayDate.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (!weekDayElement.classList.contains("unavailable")) {
      weekDayElement.addEventListener("click", (event) => {
        Telegram.WebApp.HapticFeedback.selectionChanged();
        unblockTimePicker();
        onDayClicked(weekDayElement).then(() => {});
      });
    }

    if (weekDayDate.getTime() == eventDate.getTime()) {
      weekDayElement.classList.add("selected");
      if (weekDayElement.classList.contains("unavailable")) {
        setFakeTimeSlots(
          cleanEventDate.getHours() - timezoneOffset / 60,
          cleanEventDate.getMinutes()
        );
        continue;
      }
      onDayClicked(weekDayElement, {
        hour: cleanEventDate.getHours(),
        minute: cleanEventDate.getMinutes(),
      }).then(() => {});
    }
  }

  onScheduleDataChanged({
    name: ownerInfo.name,
    hour: cleanEventDate.getHours(),
    minute: cleanEventDate.getMinutes(),
    date: cleanEventDate,
    duration: calendarEvent.duration,
  });

  stopLoading();

  showSection(1);
  setTimeout(() => {
    showSection(2);
    setTimeout(() => {
      showSection(3);
    }, 100);
  }, 100);
}
