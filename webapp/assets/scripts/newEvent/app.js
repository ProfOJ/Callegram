async function getOwnerAppointmentInfo() {
  const initData = getInitData();
  const owner_user_id = initData.start_param.split("_")[1];

  const response = await fetch(
    `http://localhost:5000/user/info/${owner_user_id}`,
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
  // example availability
  // {5: [0, 30], 6: [0, 30], 7: [0, 30], 8: [0, 30], 9: [0, 30], 10: [0, 30], 11: [0, 30], 12: [0, 30], 13: [0, 30], 14: [0, 30]}
  const scheduleHourSelector = document.getElementById("scheduleHourSelector");
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
    option.value = hour;
    option.innerText = `${hour}`.padStart(2, "0") + " h";
    scheduleHourSelector.appendChild(option);
  }

  const scheduleMinuteSelector = document.getElementById(
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
    option.innerText = `${minute}`.padStart(2, "0") + " min";
    scheduleMinuteSelector.appendChild(option);
  }

  scheduleHourSelector.addEventListener("change", (event) => {
    onHourChanged(event, availability);
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
    hideStep(2);
    hideStep(3);
    return;
  }

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
