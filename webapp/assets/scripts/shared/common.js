API_BASE_URL = "http://localhost:5000";

function getCommonHeaders() {
  return {
    Authorization: btoa(Telegram.WebApp.initData),
    "Content-Type": "application/json",
  };
}

async function authUser() {
  const response = await fetch(`${API_BASE_URL}/user/auth`, {
    headers: getCommonHeaders(),
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      timezone: new Date().getTimezoneOffset(),
    }),
  });

  if (response.status === 401) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
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

/**
 * Function to execute some callback only when the condition is met. Useful for waiting until some window objects are initialized
 * 
 * @param {Function} conditionFunction function to use for checking if the promise cab be resolved
 * @returns promise to resolve
 */
function waitFor(conditionFunction) {
  const poll = resolve => {
    if(conditionFunction()) resolve();
    else setTimeout(_ => poll(resolve), 100);
  }

  return new Promise(poll);
}