async function getEventDetails(eventId) {
  const response = await fetch(`${API_BASE_URL}/event/get/${eventId}`, {
    headers: getCommonHeaders(),
    mode: "cors",
  });

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const responseData = await response.json();
  if (!responseData.success) {
    Telegram.WebApp.showAlert(data.message);
    return;
  }

  return responseData.data.event;
}

async function editEvent(eventId, event) {
  const response = await fetch(`${API_BASE_URL}/event/edit/${eventId}`, {
    headers: getCommonHeaders(),
    mode: "cors",
    method: "PATCH",
    body: JSON.stringify(event),
  });

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert("Unauthenticated");
    Telegram.WebApp.MainButton.setText("Yes, edit it!");
    Telegram.WebApp.MainButton.hideProgress();
    return;
  }

  const responseData = await response.json();

  if (!responseData.success) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert(responseData.message);
    Telegram.WebApp.MainButton.setText("Yes, edit it!");
    Telegram.WebApp.MainButton.hideProgress();
    return;
  }

  return responseData;
}
