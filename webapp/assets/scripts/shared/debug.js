function viewportChangedEvent() {
  const sizeEl = document.getElementById("viewport-params-size");
  if (sizeEl) {
    sizeEl.innerText = `width: ${window.innerWidth} x height: ${Telegram.WebApp.viewportStableHeight}`;
  }

  const expandEl = document.getElementById("viewport-params-expand");
  if (expandEl) {
    expandEl.innerText = `expand: ${Telegram.WebApp.viewportExpand}`;
  }
}

function initErudaDebugging() {
  eruda.init();
  viewportChangedEvent();
  Telegram.WebApp.onEvent("viewportChanged", viewportChangedEvent);
}
