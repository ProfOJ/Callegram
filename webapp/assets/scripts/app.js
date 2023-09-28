async function onDayClicked(event) {
  const weekDayElement = event.target;
  const date = new Date(weekDayElement.dataset.date);

  const events = await getEventsForDate(date);
  if (!events) {
    return;
  }
}

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  populateDays();

  const weekDayElements = document.getElementsByClassName("weekDay");
  for (const weekDayElement of weekDayElements) {
    if (weekDayElement.classList.contains("unavailable")) {
      continue;
    }

    weekDayElement.addEventListener("click", (event) => {
      onDayClicked(event).then(() => {});
    });
  }

  // get current date in utc with local day
  const today = new Date();
  const date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const events = await getEventsForDate(date);

  showSection(1);
}
