async function onDayClicked(event) {
  const weekDayElement = event.target;
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }
  weekDayElement.classList.add("selected");

  const date = new Date(weekDayElement.getAttribute("data-date"));
  date.setUTCHours(0, 0, 0, 0);

  blockSection(2);
  const events = await getEventsForDate(date);
  if (!events) {
    return;
  }
  hideSection(2);
  setTimeout(() => {
    unblockSection(2);
    populateEvents(events);
    setTimeout(() => {
      showSection(2);
    }, 300);
  }, 150);
}

async function onEventClicked(event) {
  window.location.href = `/eventDetails?eventId=${event.id}`;
}

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  initTabs();
  populateDays();

  initProfile(authData.user);

  const today = new Date();
  const dateEnd = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 15)
  );
  today.setUTCHours(0, 0, 0, 0);

  const busyDays = await getBusyDays(today, dateEnd);

  busyDays.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  disableFreeDays(busyDays);
  initWeekDays();
  showSection(1);

  const firstBusyDate = new Date(busyDays[0]);
  const firstBusyDateUTC = new Date(
    Date.UTC(
      firstBusyDate.getFullYear(),
      firstBusyDate.getMonth(),
      firstBusyDate.getDate()
    )
  );
  const events = await getEventsForDate(firstBusyDateUTC);

  populateEvents(events);
  showSection(2);
}
