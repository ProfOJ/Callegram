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

async function authUser() {
  const response = await fetch("http://127.0.0.1:5000/user/auth", {
    headers: {
      Authorization: btoa(Telegram.WebApp.initData),
      "Content-Type": "application/json",
    },
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      timezone: new Date().getTimezoneOffset() * 60,
    }),
  });

  if (response.status === 401) {
    Telegram.WebApp.showAlert("Unauthenticated");
    return;
  }

  const data = await response.json();

  if (data.success) {
    return data.data;
  }
}
