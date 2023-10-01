async function deleteEvent(eventId) {
  const response = await fetch(
    `${API_BASE_URL}/event/delete/${eventId}`,
    {
      headers: getCommonHeaders(),
      mode: "cors",
      method: "DELETE",
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

  return responseData;
}
