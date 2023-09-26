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

function onDayClicked(event) {
  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }

  const element = event.target;
  element.classList.add("selected");
  const date = new Date(element.getAttribute("data-date"));
  getDayAvailability(date).then((availability) => {
    console.log(availability);
  });
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
    if (daySchedule[0] === 0 && daySchedule[1] === 0) { // from 00:00 to 00:00 - unavailable
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
    weekDayElement.addEventListener("click", onDayClicked);
  }
}
