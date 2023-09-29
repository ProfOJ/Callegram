async function getOwnerAppointmentInfo(ownerUserId) {
  const response = await fetch(
    `http://localhost:5000/user/info/${ownerUserId}`,
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

async function getDayAvailability(date, ownerUserId) {
  date = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const response = await fetch(
    `http://localhost:5000/schedule/day_availability/${ownerUserId}?date=${date.toISOString()}`,
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
