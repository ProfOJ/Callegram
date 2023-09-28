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
  const eventContainer = document.createElement("div");
  eventContainer.classList.add("dayEvent");

  const eventPerson = document.createElement("div");
  eventPerson.classList.add("dayEventPerson");
  eventContainer.appendChild(eventPerson);

  if (stub) {
    eventContainer.classList.add("dayEventStub");
    eventPerson.innerText = "No calls";
    return eventContainer;
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

  return eventContainer;
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

      if (eventMinutes === 0) {
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
