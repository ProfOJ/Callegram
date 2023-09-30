async function getEventsForDate(date) {
  const response = await fetch(
    `http://localhost:5000/event/get_all?date=${date.toISOString()}`,
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

  return responseData.data.events;
}

async function getBusyDays(from, to) {
  const response = await fetch(
    `http://localhost:5000/schedule/busy_days?from_date=${from.toISOString()}&to_date=${to.toISOString()}`,
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

  return responseData.data.busy_days;
}

async function updateUserProfile(userId, profileData) {
  const response = await fetch(`http://localhost:5000/user/update/${userId}`, {
    headers: getCommonHeaders(),
    mode: "cors",
    method: "POST",
    body: JSON.stringify(profileData),
  });

  if (response.status === 401) {
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data;
}
