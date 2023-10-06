// user profile data that's only filled on load and when saving changes
const initialProfileData = {
  name: "",
  timezone: new Date().getTimezoneOffset(),
  scheduleDays: [],
  scheduleType: "default",
};

// current profile data
const profileData = {
  timezone: new Date().getTimezoneOffset(),
};

const saveProfileCallback = () => {
  Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
  onSaveDataClick().then(() => {});
};

const shareScheduleCallback = () => {
  onScheduleShareClick();
};

function wasProfileDataChanged() {
  return !(
    profileData.name === initialProfileData.name &&
    profileData.schedule_days.toString() ===
      initialProfileData.scheduleDays.toString() &&
    profileData.schedule_type === initialProfileData.scheduleType
  );
}

/**
 * "Calls" tab week day click handler. Warns for inactive days, loads and displays events for the selected date.
 *
 * @param {MouseEvent} event click event
 * @returns nothing
 */
async function onDayClicked(event) {
  const weekDayElement = event.target;

  if (weekDayElement.classList.contains("unavailable")) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
    Telegram.WebApp.showAlert("There are no calls on this day.");
    return;
  }

  const allDays = document.getElementsByClassName("weekDay");
  for (const day of allDays) {
    day.classList.remove("selected");
  }
  weekDayElement.classList.add("selected");

  const date = new Date(weekDayElement.getAttribute("data-date"));
  const dateUTC = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
  blockSection(2);
  const events = await getEventsForDate(dateUTC);
  if (!events) {
    return;
  }
  hideSection(2);
  setTimeout(() => {
    unblockSection(2);
    populateEvents(events);
    setTimeout(() => {
      showSection(2);
    }, 150);
  }, 150);
}

function onScheduleShareClick() {
  Telegram.WebApp.switchInlineQuery(`book#${new Date().getTime()}`, ["users"]);
}

/**
 * "Save changes" MainButton click handler. Saves updated user profile info and resets the sate.
 *
 * @returns nothing
 */
async function onSaveDataClick() {
  if (!wasProfileDataChanged()) {
    return;
  }

  const profileNameInput = document.getElementById("profileNameInput");
  profileNameInput.blur();

  Telegram.WebApp.MainButton.showProgress();
  const userId = await getUser().id;

  const result = await updateUserProfile(userId, profileData);

  Telegram.WebApp.MainButton.hideProgress();
  if (!result) {
    return;
  }

  initialProfileData.name = profileData.name;
  initialProfileData.scheduleDays = profileData.schedule_days;
  initialProfileData.scheduleType = profileData.schedule_type;

  Telegram.WebApp.MainButton.setText("Share my schedule");
  Telegram.WebApp.MainButton.onClick(shareScheduleCallback);
  Telegram.WebApp.MainButton.offClick(saveProfileCallback);
}

async function onEventClicked(event) {
  Telegram.WebApp.HapticFeedback.impactOccurred("light"); // visual feedback is not immediate
  window.location.href = `/eventDetails?eventId=${event.id}`;
}

function onProfileDataChanged(newData) {
  if (newData.hasOwnProperty("name")) {
    profileData.name = newData["name"];
  }

  if (newData.hasOwnProperty("scheduleDays")) {
    profileData.schedule_days = newData["scheduleDays"];
  }

  if (newData.hasOwnProperty("scheduleType")) {
    profileData.schedule_type = newData["scheduleType"];
  }

  if (wasProfileDataChanged()) {
    Telegram.WebApp.MainButton.offClick(shareScheduleCallback);
    Telegram.WebApp.MainButton.onClick(saveProfileCallback);
    Telegram.WebApp.MainButton.setText("Save changes");
  } else {
    Telegram.WebApp.MainButton.offClick(saveProfileCallback);
    Telegram.WebApp.MainButton.onClick(shareScheduleCallback);
    Telegram.WebApp.MainButton.setText("Share my schedule");
  }
}

async function main() {
  Telegram.WebApp.expand();
  const authData = await authUser();
  if (!authData) {
    return;
  }

  initTabs();
  populateDays();

  initialProfileData.name = authData.user.name;
  profileData.name = authData.user.name;
  // {"1": [], "2": []} to [1, 2] etc.
  const scheduleDays = Object.keys(authData.user.schedule.windows).map((day) =>
    parseInt(day)
  );
  initialProfileData.scheduleDays = scheduleDays;
  profileData.schedule_days = scheduleDays;
  // scheduleType is initialized in initProfile() to not duplicate code

  Telegram.WebApp.MainButton.setText("Share my schedule");

  initProfile(authData);

  const today = new Date();
  const dateEnd = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 15)
  );
  today.setHours(0, 0, 0, 0);

  const busyDays = await getBusyDays(today, dateEnd);

  // sort busy dates in ascending order
  busyDays.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  disableFreeDays(busyDays);
  initWeekDays();
  stopLoading();
  showSection(1);

  const firstBusyDate = new Date(busyDays[0]);
  const firstBusyDateUTC = new Date(
    Date.UTC(
      firstBusyDate.getFullYear(),
      firstBusyDate.getMonth(),
      firstBusyDate.getDate()
    )
  );

  if (firstBusyDate) {
    const events = await getEventsForDate(firstBusyDateUTC);
    populateEvents(events);
  }

  showSection(2);
}
