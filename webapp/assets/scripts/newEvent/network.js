
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