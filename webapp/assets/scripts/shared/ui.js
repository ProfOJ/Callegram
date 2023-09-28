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