function disableFreeDays(busyDays) {
  const weekDayElements = document.getElementsByClassName("weekDay");

  for (const weekDayElement of weekDayElements) {
    const date = new Date(weekDayElement.getAttribute("data-date"));

    const dateString = date.toISOString().split("T")[0];
    if (!busyDays.includes(dateString)) {
      weekDayElement.classList.add("unavailable");
      weekDayElement.setAttribute("title", "No calls on this day");
    }
  }
}

function createEventElement(event, stub = false) {
  const eventRootContainer = document.createElement("div");
  eventRootContainer.classList.add("dayEvent");

  const eventContainer = document.createElement("div");

  const eventPerson = document.createElement("div");
  eventPerson.classList.add("dayEventPerson");
  eventContainer.appendChild(eventPerson);

  if (stub) {
    eventRootContainer.classList.add("dayEventStub");
    eventPerson.innerText = "No calls";
    eventRootContainer.appendChild(eventContainer);
    return eventRootContainer;
  }

  const userId = getUser().id;
  const isOwner = event.owner_user_id === userId;
  eventPerson.innerText = isOwner
    ? event.invited_user.name
    : event.owner_user.name;

  const eventTime = document.createElement("div");
  eventTime.classList.add("dayEventTime");

  const eventDate = new Date(event.appointment_time + "Z");
  const eventDateEnd = new Date(
    eventDate.getTime() + +event.duration.slice(2, -1) * 1000
  );

  const startTimeText =
    `${eventDate.getHours()}`.padStart(2, "0") +
    `:${`${eventDate.getMinutes()}`.padStart(2, "0")}`;
  const endTimeText =
    `${eventDateEnd.getHours()}`.padStart(2, "0") +
    `:${`${eventDateEnd.getMinutes()}`.padStart(2, "0")}`;
  const eventTimeString = `${startTimeText} - ${endTimeText}`;
  eventTime.innerText = eventTimeString;

  eventContainer.appendChild(eventTime);
  eventContainer.setAttribute("data-event-id", event.id);

  eventRootContainer.appendChild(eventContainer);

  const eventArrowIcon = document.createElement("div");
  eventArrowIcon.classList.add("dayEventArrowIcon");
  const useElement = document.createElement("use");
  useElement.setAttribute("style", "fill: #000000;");
  useElement.setAttribute("href", "/assets/images/chevron-right.svg");
  eventArrowIcon.appendChild(useElement);
  eventRootContainer.appendChild(eventArrowIcon);

  return eventRootContainer;
}

function populateEvents(events) {
  const eventsByHour = {};

  // group events by hour and sort them
  for (const event of events) {
    const eventDate = new Date(event.appointment_time + "Z");
    const eventHour = eventDate.getUTCHours();

    if (!eventsByHour[eventHour]) {
      eventsByHour[eventHour] = [];
    }

    eventsByHour[eventHour].push(event);
  }

  for (const hour in eventsByHour) {
    eventsByHour[hour].sort((a, b) => {
      const aDate = new Date(a.appointment_time);
      const bDate = new Date(b.appointment_time);

      return aDate - bDate;
    });
  }

  // populate events container with events
  const dayEventsContainer = document.getElementById("eventsForDayList");
  dayEventsContainer.innerHTML = "";

  for (const hour in eventsByHour) {
    const hourEvents = eventsByHour[hour];

    const hourEventsContainer = document.createElement("div");
    hourEventsContainer.classList.add("dayEventRow");

    const hourEventsWindow = document.createElement("div");
    hourEventsWindow.classList.add("dayEventRowWindow");
    const timezoneOffset = new Date().getTimezoneOffset();
    const localHour = +hour - timezoneOffset / 60;
    hourEventsWindow.innerText = `${`${localHour}`.padStart(2, "0")}:00 - ${`${
      localHour + 1
    }`.padStart(2, "0")}:00`;

    const hourEventsList = document.createElement("div");

    for (let eventIndex = 0; eventIndex < hourEvents.length; eventIndex++) {
      const event = hourEvents[eventIndex];

      const eventContainer = createEventElement(event);

      // add event listener to event container
      eventContainer.addEventListener("click", () => {
        onEventClicked(event).then(() => {});
      });

      if (hourEvents.length != 1) {
        hourEventsList.appendChild(eventContainer);
        continue;
      }

      const stubEventContainer = createEventElement(null, true);

      const eventDate = new Date(event.appointment_time + "Z");
      const eventMinutes = eventDate.getMinutes();

      if (eventMinutes === 30) {
        hourEventsList.appendChild(stubEventContainer);
        hourEventsList.appendChild(eventContainer);
      } else {
        hourEventsList.appendChild(eventContainer);
        hourEventsList.appendChild(stubEventContainer);
      }
    }

    hourEventsContainer.appendChild(hourEventsWindow);
    hourEventsContainer.appendChild(hourEventsList);
    dayEventsContainer.appendChild(hourEventsContainer);
  }
}

function showTabContent(tabName) {
  const tabContents = document.getElementsByClassName("tabContent");
  for (const tabContent of tabContents) {
    if (tabContent.getAttribute("data-tab-content") !== tabName) {
      tabContent.classList.add("inactive");
      continue;
    }

    tabContent.classList.remove("inactive");
  }
}

function switchTab(tab) {
  const tabName = tab.getAttribute("data-tab");
  const tabBarIndicator = document.getElementById("tabBarIndicator");

  switch (tabName) {
    case "calls":
      callsAnimation.goToAndStop(0);
      callsAnimation.play();
      tabBarIndicator.style.gridColumn = "1 / 2";
      showTabContent("calls");
      Telegram.WebApp.MainButton.hide();
      break;

    case "profile":
      profileAnimation.goToAndStop(0);
      profileAnimation.play();
      tabBarIndicator.style.gridColumn = "2 / 3";
      showTabContent("profile");
      Telegram.WebApp.MainButton.show();
      break;

    default:
      break;
  }
}

function initTabs() {
  const tabs = document.getElementsByClassName("tab");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      switchTab(tab);
    });
  }
}

function initWeekDays() {
  const weekDayElements = document.getElementsByClassName("weekDay");
  let checkedFirstBusyDay = false;
  for (const weekDayElement of weekDayElements) {
    if (weekDayElement.classList.contains("unavailable")) {
      continue;
    }

    if (!checkedFirstBusyDay) {
      weekDayElement.classList.add("selected");
      checkedFirstBusyDay = true;
    }

    weekDayElement.addEventListener("click", (event) => {
      onDayClicked(event).then(() => {});
    });
  }
}

function refreshProfileDayAvailability(windows) {
  const scheduleDays = [0, 1, 2, 3, 4, 5, 6];
  const weekDays = document.getElementsByClassName("settingsWeekDayName");

  for (let i = 0; i < weekDays.length; i++) {
    const weekDay = weekDays[i];
    const daySchedule = windows[i];

    if (daySchedule[0] === 0 && daySchedule[1] === 0) {
      // from 00:00 to 00:00 - unavailable
      weekDay.classList.add("unavailable");
      scheduleDays.splice(scheduleDays.indexOf(i), 1);
      continue;
    }

    weekDay.classList.remove("unavailable");
  }

  initialProfileData.scheduleDays = [...scheduleDays];
  profileData.schedule_days = [...scheduleDays];

  const weekDayElements = document.getElementsByClassName(
    "settingsWeekDayName"
  );

  for (let dayIndex = 0; dayIndex < weekDayElements.length; dayIndex++) {
    const weekDayElement = weekDayElements[dayIndex];
    weekDayElement.onclick = () => {
      const oldScheduleDays = [...profileData.schedule_days];

      if (weekDayElement.classList.contains("unavailable")) {
        weekDayElement.classList.remove("unavailable");
        oldScheduleDays.push(dayIndex);
        oldScheduleDays.sort();
        onProfileDataChanged({ scheduleDays: oldScheduleDays });
        return;
      }

      weekDayElement.classList.add("unavailable");
      oldScheduleDays.splice(oldScheduleDays.indexOf(dayIndex), 1);
      onProfileDataChanged({ scheduleDays: oldScheduleDays });
    };
  }
}

function initScheduleType(windows) {
  const scheduleTypes = document.getElementsByClassName("scheduleType");
  for (const scheduleType of scheduleTypes) {
    scheduleType.onclick = () => {
      selectScheduleType(scheduleType.getAttribute("data-schedule-type"));
    };
  }

  // go through windows and find the first available window
  const firstAvailableDay = windows.find((day) => {
    return day[0] !== 0 || day[1] !== 0;
  });

  if (!firstAvailableDay) {
    return;
  }

  const firstAvailableHour = firstAvailableDay[0];
  const timezoneOffset = new Date().getTimezoneOffset();
  const localHour = (firstAvailableHour - timezoneOffset) / 60;

  switch (localHour) {
    case 7:
      initialProfileData.scheduleType = "early";
      profileData.schedule_type = "early";
      selectScheduleType("early");
      break;

    case 9:
      initialProfileData.scheduleType = "default";
      profileData.schedule_type = "default";
      selectScheduleType("default");
      break;

    case 12:
      initialProfileData.scheduleType = "late";
      profileData.schedule_type = "late";
      selectScheduleType("late");
      break;

    default:
      break;
  }
}

function selectScheduleType(scheduleType) {
  // type "early" starts from 7:00 and ends at 16:00
  // type "default" starts from 9:00 and ends at 18:00
  // type "late" starts from 12:00 and ends at 21:00
  const scheduleTypes = document.getElementsByClassName("scheduleType");
  const timeFrameLine = document.getElementById("timeFrameLine");

  for (const scheduleTypeEl of scheduleTypes) {
    scheduleTypeEl.classList.remove("active");

    const elementType = scheduleTypeEl.getAttribute("data-schedule-type");
    if (elementType == scheduleType) {
      scheduleTypeEl.classList.add("active");
    }
  }

  timeFrameLine.classList = `timeFrameLine ${scheduleType}`;
  const timeFrameTimes = document.getElementById("timeFrameTimes");

  switch (scheduleType) {
    case "early":
      timeFrameTimes.innerText = "From 7:00 to 16:00";
      break;

    case "default":
      timeFrameTimes.innerText = "From 9:00 to 18:00";
      break;

    case "late":
      timeFrameTimes.innerText = "From 12:00 to 21:00";
      break;

    default:
      break;
  }

  onProfileDataChanged({ scheduleType: scheduleType });
}

function initProfile(authData) {
  refreshProfileDayAvailability(authData.user.schedule.windows);
  initScheduleType(authData.user.schedule.windows);

  const profileNameInput = document.getElementById("profileNameInput");
  profileNameInput.value = authData.user.name;
  profileNameInput.addEventListener("input", (event) => {
    onProfileDataChanged({ name: event.target.value });
  });
}
