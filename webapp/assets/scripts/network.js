async function getEventsForDate(date) {
  const response = await fetch(
    `${API_BASE_URL}/event/get_all?date=${date.toISOString()}`,
    {
      headers: getCommonHeaders(),
      mode: "cors",
    }
  );

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data.events;
}

async function getBusyDays(from, to) {
  const response = await fetch(
    `${API_BASE_URL}/schedule/busy_days?from_date=${from.toISOString()}&to_date=${to.toISOString()}`,
    {
      headers: getCommonHeaders(),
      mode: "cors",
    }
  );

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data.busy_days;
}

async function updateUserProfile(userId, profileData) {
  const response = await fetch(`${API_BASE_URL}/user/update/${userId}`, {
    headers: getCommonHeaders(),
    mode: "cors",
    method: "POST",
    body: JSON.stringify(profileData),
  });

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data;
}
