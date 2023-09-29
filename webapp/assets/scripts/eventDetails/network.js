async function getEventDetails(eventId) {
  const response = await fetch(`http://localhost:5000/event/get/${eventId}`, {
    headers: getCommonHeaders(),
    mode: "cors",
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

  return responseData.data.event;
}

async function deleteEvent(eventId) {
  const response = await fetch(
    `http://localhost:5000/event/delete/${eventId}`,
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
