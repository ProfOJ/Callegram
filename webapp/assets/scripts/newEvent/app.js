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

async function getOwnerAppointmentInfo() {
  const initData = getInitData();
  const ownerUserId = initData.start_param.split("_")[1];

  scheduleData.invited_user_id = getUser().id;

  const response = await fetch(
    `http://localhost:5000/user/info/${ownerUserId}`,
    {
      headers: getCommonHeaders(),
      mode: "cors",
    }
  );
  if (response.status === 401) {
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data.user;
}

async function getDayAvailability(date) {
  const initData = getInitData();
  const owner_user_id = initData.start_param.split("_")[1];

  date = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const response = await fetch(
    `http://localhost:5000/schedule/day_availability/${owner_user_id}?date=${date.toISOString()}`,
    {
      headers: getCommonHeaders(),
      mode: "cors",
    }
  );
  if (response.status === 401) {
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data.day_availability;
}

function showStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.remove("hidden");
      break;
    }
  }
}

function hideStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.add("hidden");
      break;
    }
  }
}

function populateTimeSlots(availability, selectedDate) {
  let scheduleHourSelector = document.getElementById("scheduleHourSelector");
  scheduleHourSelector.innerHTML = "";

  const hours = Object.keys(availability);

  //remove hours before current hour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  if (today.getTime() === selectedDate.getTime()) {
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
  if (today.getTime() === selectedDate.getTime()) {
    const currentMinute = new Date().getUTCMinutes();
    for (let i = 0; i < minutes.length; i++) {
      const minute = minutes[i];
      if (minute < currentMinute) {
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

async function onDayClicked(event) {
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }

  const element = event.target;
  element.classList.add("selected");
  const selectedDate = new Date(element.getAttribute("data-date"));
  const availability = await getDayAvailability(selectedDate);

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
    hideStep(3);
    hideStep(2);
    Telegram.WebApp.MainButton.hide();
    return;
  }

  onScheduleDataChanged({
    date: selectedDate,
    hour: +hours[0],
    minute: +minutes[0],
  });

  populateTimeSlots(availability, selectedDate);
  showStep(2);
  Telegram.WebApp.MainButton.show();
  Telegram.WebApp.MainButton.setText("Yes, schedule it!");
  setTimeout(() => {
    showStep(3);
  }, 300);
}

function populateDays() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const todayDay = today.getDay();

  const weekDayNames = document.getElementsByClassName("weekDayName");
  for (let i = 0; i < weekDayNames.length; i++) {
    const weekDayName = weekDayNames[i];
    const dayIndex = (todayDay + i) % 7; // 0 - 6
    weekDayName.innerText = days[dayIndex];

    // Sunday or Saturday
    if (dayIndex === 0 || dayIndex === 6) {
      weekDayName.classList.add("weekend");
    }
  }

  const weekDayDates = document.getElementsByClassName("weekDay");
  for (let i = 0; i < weekDayDates.length; i++) {
    const weekDayDate = weekDayDates[i];
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    weekDayDate.innerText = date.getDate();
    weekDayDate.setAttribute("data-date", date.toISOString());
  }
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

  onScheduleDataChanged({ name: ownerInfo.name });
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

  showStep(1);
}
