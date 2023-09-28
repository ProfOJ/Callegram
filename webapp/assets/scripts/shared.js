function themeChangedCallback() {
  document.documentElement.className = Telegram.WebApp.colorScheme;
  document.body.setAttribute(
    "style",
    "--bg-color:" + Telegram.WebApp.backgroundColor
  );
}

function initApp(debug = false) {
  Telegram.WebApp.ready();
  Telegram.WebApp.setHeaderColor("secondary_bg_color");
  Telegram.WebApp.onEvent("themeChanged", themeChangedCallback);

  if (debug && window.eruda != undefined) {
    initErudaDebugging();
  }
}

function getInitData() {
  const initData = new URLSearchParams(Telegram.WebApp.initData);
  const initDataObject = {};
  for (const [key, value] of initData) {
    initDataObject[key] = value;
  }
  if (initDataObject.hasOwnProperty("user")) {
    initDataObject["user"] = JSON.parse(initDataObject["user"]);
  }
  return initDataObject;
}

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
