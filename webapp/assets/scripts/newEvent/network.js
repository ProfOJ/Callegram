async function getOwnerAppointmentInfo() {
  const initData = getInitData();
  const ownerUserId = initData.start_param.split("_")[1];

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

async function getDayAvailability(date) {
  const initData = getInitData();
  const ownerUserId = initData.start_param.split("_")[1];

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

async function createEvent(event) {
    const response = await fetch("http://localhost:5000/event/create", {
      headers: getCommonHeaders(),
      mode: "cors",
      method: "POST",
      body: JSON.stringify(event),
    });
  
    if (response.status === 401) {
      Telegram.WebApp.showAlert("Unauthenticated");
      Telegram.WebApp.MainButton.setText("Yes, schedule it!");
      Telegram.WebApp.MainButton.hideProgress();
      return;
    }
  
    const responseData = await response.json();
  
    if (!responseData.success) {
      Telegram.WebApp.showAlert(responseData.message);
      Telegram.WebApp.MainButton.setText("Yes, schedule it!");
      Telegram.WebApp.MainButton.hideProgress();
      return;
    }

    return responseData;
  }