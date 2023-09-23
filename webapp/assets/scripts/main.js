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

  if (debug) {
    initErudaDebugging();
  }
}
