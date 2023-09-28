const scheduleData = {
  owner_user_id: null,
  invited_user_id: null,
  appointment_time: new Date(),
  duration: "PT30M", // hardcoded on server anyway
};

const scheduleSummary = {
  dateTime: new Date(),
  duration: "30 min",
  name: "",
};

function populateTimeSlots(availability, selectedDate) {
  let scheduleHourSelector = document.getElementById("scheduleHourSelector");
  scheduleHourSelector.innerHTML = "";

  const hours = Object.keys(availability);

  //remove hours before current hour
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateClone = new Date(selectedDate);
  selectedDateClone.setHours(0, 0, 0, 0);
  if (today.getTime() === selectedDateClone.getTime()) {
    const currentHour = new Date().getUTCHours();
    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i];
      if (hour < currentHour) {
        hours.splice(i, 1);
        i--;
      }
    }
  }

  for (const hour of hours) {
    const option = document.createElement("option");

    // -8 utc offset
    const timezoneOffset = new Date().getTimezoneOffset();
    let localHour = +hour - timezoneOffset / 60;

    // overflow
    let overflow = 0;
    if (localHour < 0) {
      localHour += 24;
      overflow = -1;
    }

    if (localHour > 23) {
      localHour -= 24;
      overflow = 1;
    }

    option.value = hour;
    option.innerText =
      `${localHour}`.padStart(2, "0") +
      `h ${overflow === 0 ? "" : overflow === -1 ? "yesterday" : "tomorrow"}`;
    scheduleHourSelector.appendChild(option);
  }

  let scheduleMinuteSelector = document.getElementById(
    "scheduleMinuteSelector"
  );
  scheduleMinuteSelector.innerHTML = "";

  const minutes = availability[hours[0]];

  //remove minutes before current minute
  if (today.getTime() === selectedDateClone.getTime()) {
    for (let i = 0; i < minutes.length; i++) {
      const minute = minutes[i];
      
      const selectedDateWithCurrentTime = new Date(selectedDate);
      selectedDateWithCurrentTime.setUTCHours(hours[0], minute, 0, 0);
      if (selectedDateWithCurrentTime.getTime() < new Date().getTime()) {
        minutes.splice(i, 1);
        i--;
      }
    }
  }

  for (const minute of minutes) {
    const option = document.createElement("option");
    option.value = minute;
    option.innerText = `${minute}`.padStart(2, "0") + "min";
    scheduleMinuteSelector.appendChild(option);
  }

  // clear all event listeners
  scheduleHourSelector.parentNode.replaceChild(
    scheduleHourSelector.cloneNode(true),
    scheduleHourSelector
  );
  scheduleMinuteSelector.parentNode.replaceChild(
    scheduleMinuteSelector.cloneNode(true),
    scheduleMinuteSelector
  );

  // get new element refs
  scheduleHourSelector = document.getElementById("scheduleHourSelector");
  scheduleMinuteSelector = document.getElementById("scheduleMinuteSelector");

  scheduleHourSelector.addEventListener("change", (event) => {
    onHourChanged(event, availability);
  });

  scheduleHourSelector.addEventListener("change", (event) => {
    onScheduleDataChanged({ hour: +event.target.value });
  });

  scheduleMinuteSelector.addEventListener("change", (event) => {
    onScheduleDataChanged({ minute: +event.target.value });
  });
}

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
}

function refreshSummary() {
  const scheduleConfirmationDateTime = document
    .getElementById("scheduleConfirmationDateTime")
    .getElementsByClassName("scheduleData")[0];
  const scheduleConfirmationDuration = document
    .getElementById("scheduleConfirmationDuration")
    .getElementsByClassName("scheduleData")[0];
  const scheduleConfirmationUser = document
    .getElementById("scheduleConfirmationUser")
    .getElementsByClassName("scheduleData")[0];

  // set date time in format "dd MMM yyyy, HH:mm"
  scheduleConfirmationDateTime.innerText = new Date(
    scheduleSummary.dateTime
  ).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  scheduleConfirmationDuration.innerText = scheduleSummary.duration;
  scheduleConfirmationUser.innerText = scheduleSummary.name;
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

async function onScheduleConfirmed() {
  Telegram.WebApp.MainButton.setText("Scheduling...");
  Telegram.WebApp.MainButton.showProgress();

  const response = await createEvent(scheduleData);

  if (!response.success) {
    return;
  }

  Telegram.WebApp.MainButton.hide();
  Telegram.WebApp.MainButton.hideProgress();
  Telegram.WebApp.onEvent("popupClosed", () => {
    Telegram.WebApp.close();
  });
  Telegram.WebApp.showPopup({
    title: "Call scheduled!",
    message: "You will be notified in 30 and 15 minutes before the call",
    buttons: [
      {
        id: "ok",
        type: "ok",
      },
    ],
  });
}

async function onDayClicked(event) {
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }

  const element = event.target;
  element.classList.add("selected");
  const selectedDate = new Date(element.getAttribute("data-date"));
  blockSection(2);
  blockSection(3);
  const availability = await getDayAvailability(selectedDate);
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
    Telegram.WebApp.showAlert(
      "No available time slots, please select another day"
    );
    hideSection(3);
    hideSection(2);
    Telegram.WebApp.MainButton.hide();
    return;
  }

  onScheduleDataChanged({
    date: selectedDate,
    hour: +hours[0],
    minute: availability[hours[0]][0],
  });

  populateTimeSlots(availability, selectedDate);
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

function refreshDayAvailability(schedule) {
  const weekDayDates = document.getElementsByClassName("weekDay");
  for (let i = 0; i < weekDayDates.length; i++) {
    const weekDayDate = weekDayDates[i];
    const date = new Date(weekDayDate.getAttribute("data-date"));

    // day of week starting from monday
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    const daySchedule = schedule[dayOfWeek - 1];
    if (daySchedule[0] === 0 && daySchedule[1] === 0) {
      // from 00:00 to 00:00 - unavailable
      weekDayDate.classList.add("unavailable");
    }
  }
}

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  const ownerInfo = await getOwnerAppointmentInfo();
  if (!ownerInfo) {
    return;
  }

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
