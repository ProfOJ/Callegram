function stopLoading() {
  loadingAnimation.stop();
  const loading = document.getElementById("loadingAnimation");
  loading.classList.add("hidden");
  setTimeout(() => {
    loading.remove();
  }, 150);
}

function showSection(index) {
  const sections = document.getElementsByClassName("pageSection");

  for (const section of sections) {
    if (section.getAttribute("data-section") === `${index}`) {
      section.classList.remove("hidden");
      break;
    }
  }
}

function hideSection(index) {
  const sections = document.getElementsByClassName("pageSection");

  for (const section of sections) {
    if (section.getAttribute("data-section") === `${index}`) {
      section.classList.add("hidden");
      break;
    }
  }
}

function blockSection(index) {
  const sections = document.getElementsByClassName("pageSection");

  for (const section of sections) {
    if (section.getAttribute("data-section") === `${index}`) {
      section.classList.add("blocked");
      break;
    }
  }
}

function unblockSection(index) {
  const sections = document.getElementsByClassName("pageSection");

  for (const section of sections) {
    if (section.getAttribute("data-section") === `${index}`) {
      section.classList.remove("blocked");
      break;
    }
  }
}

// used to initialize generic two week calendar view
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
    weekDayDate.setAttribute("data-date", date.toString());
  }
}

// used to initialize and refresh generic selectors for hour and minute
function populateTimeSlots(availability, selectedDate) {
  let scheduleHourSelector = document.getElementById("scheduleHourSelector");
  scheduleHourSelector.innerHTML = "";

  const hours = Object.keys(availability);

  //remove all hours and minutes which are in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateClone = new Date(selectedDate);
  selectedDateClone.setHours(0, 0, 0, 0);

  if (today.getTime() === selectedDateClone.getTime()) {
    for (let hourIndex = 0; hourIndex < hours.length; hourIndex++) {
      const hour = hours[hourIndex];

      for (
        let minuteIndex = 0;
        minuteIndex < availability[hour].length;
        minuteIndex++
      ) {
        const minute = availability[hour][minuteIndex];
        const selectedDateWithCurrentTime = new Date(selectedDate);
        selectedDateWithCurrentTime.setUTCHours(hour, minute, 0, 0);

        if (selectedDateWithCurrentTime.getTime() < new Date().getTime()) {
          availability[hour].splice(availability[hour].indexOf(minute), 1);
          minuteIndex--;
        }
      }

      if (availability[hour].length === 0) {
        delete availability[hour];
        hours.splice(hourIndex, 1);
        hourIndex--;
      }
    }
  }

  for (const hour of hours) {
    const option = document.createElement("option");

    const timezoneOffset = new Date().getTimezoneOffset();
    let localHour = +hour - timezoneOffset / 60;

    // overflow hours to next or previous days
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

  return [+hours[0], +minutes[0]];
}

function setFakeTimeSlots(hour, minute) {
  let scheduleHourSelector = document.getElementById("scheduleHourSelector");
  let scheduleMinuteSelector = document.getElementById(
    "scheduleMinuteSelector"
  );

  scheduleHourSelector.innerHTML = "";
  scheduleMinuteSelector.innerHTML = "";

  const option = document.createElement("option");
  option.value = hour;
  option.innerText = `${hour}`.padStart(2, "0") + "h";
  scheduleHourSelector.appendChild(option);

  const option2 = document.createElement("option");
  option2.value = minute;
  option2.innerText = `${minute}`.padStart(2, "0") + "min";
  scheduleMinuteSelector.appendChild(option2);

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

  blockTimePicker();
}

function blockTimePicker() {
  const scheduleHourSelector = document.getElementById("scheduleHourSelector");
  const scheduleMinuteSelector = document.getElementById(
    "scheduleMinuteSelector"
  );

  scheduleHourSelector.disabled = true;
  scheduleMinuteSelector.disabled = true;
}

function unblockTimePicker() {
  const scheduleHourSelector = document.getElementById("scheduleHourSelector");
  const scheduleMinuteSelector = document.getElementById(
    "scheduleMinuteSelector"
  );

  scheduleHourSelector.disabled = false;
  scheduleMinuteSelector.disabled = false;
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
