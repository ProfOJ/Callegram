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
