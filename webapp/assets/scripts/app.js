async function onDayClicked(event) {
  const weekDayElement = event.target;
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }
  weekDayElement.classList.add("selected");

  const date = new Date(weekDayElement.getAttribute("data-date"));
  date.setUTCHours(0, 0, 0, 0);

  const events = await getEventsForDate(date);
  if (!events) {
    return;
  }
}

function disableFreeDays(busyDays) {
  // busyDays example: ["2023-09-28", "2023-09-29", "2023-10-02"]
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

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  populateDays();

  const today = new Date();
  const dateEnd = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 15)
  );
  today.setUTCHours(0, 0, 0, 0);
  const busyDays = await getBusyDays(today, dateEnd);

  disableFreeDays(busyDays);

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

  const firstBusyDate = new Date(busyDays[0]);
  const firstBusyDateUTC = new Date(
    Date.UTC(
      firstBusyDate.getFullYear(),
      firstBusyDate.getMonth(),
      firstBusyDate.getDate()
    )
  );
  const events = await getEventsForDate(firstBusyDateUTC);

  showSection(1);
}
