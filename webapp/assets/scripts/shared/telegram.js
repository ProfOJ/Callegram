function themeChangedCallback() {
  document.documentElement.className = Telegram.WebApp.colorScheme;
  document.body.setAttribute(
    "style",
    "--bg-color:" + Telegram.WebApp.backgroundColor
  );
}

function initTelegramApp(debug = false) {
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
