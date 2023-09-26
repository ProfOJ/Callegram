async function getOwnerAppointmentInfo() {
  const initData = getInitData();

  const owner_user_id = initData.start_param.split("_")[1];

  const response = await fetch(
    `http://localhost:5000/user/info/${owner_user_id}`,
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

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  const ownerInfo = await getOwnerAppointmentInfo();
  if (!ownerInfo) {
    return;
  }

  console.log(ownerInfo);

  stopLoading();

  const eventTitle = document.getElementById("eventTitle");
  eventTitle.innerHTML = `<p>Scheduling a call with <span class="font-bold">${ownerInfo.name}</span></p>`;
}
