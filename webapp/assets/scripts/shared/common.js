function getCommonHeaders() {
  return {
    Authorization: btoa(Telegram.WebApp.initData),
    "Content-Type": "application/json",
  };
}

async function authUser() {
  const response = await fetch("http://127.0.0.1:5000/user/auth", {
    headers: getCommonHeaders(),
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      timezone: new Date().getTimezoneOffset(),
    }),
  });

  if (response.status === 401) {
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const data = await response.json();

  if (data.success) {
    localStorage.setItem("user", JSON.stringify(data.data.user));
    return data.data;
  }
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}
