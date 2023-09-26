function stopLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementsByTagName("main")[0].style.display = "block";
}

function startLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementsByTagName("main")[0].style.display = "none";
}

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
  return initDataObject;
}

async function authUser() {
  const response = await fetch("http://127.0.0.1:5000/user/auth", {
    headers: {
      Authorization: btoa(Telegram.WebApp.initData),
      "Content-Type": "application/json",
    },
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
    localStorage.setItem("user", data.data.user);
    return data.data;
  }
}

function getUser() {
  return localStorage.getItem("user");
}
