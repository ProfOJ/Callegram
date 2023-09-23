function viewportChangedEvent() {
  var sizeEl = document.getElementById("viewport-params-size");
  sizeEl.innerText = `width: ${window.innerWidth} x height: ${Telegram.WebApp.viewportStableHeight}`;

  var expandEl = document.querySelector("#viewport-params-expand");
  expandEl.innerText = `Is Expanded: ${Telegram.WebApp.isExpanded}`;
}

function initErudaDebugging() {
  eruda.init();
  viewportChangedEvent();
  Telegram.WebApp.onEvent("viewportChanged", viewportChangedEvent);
}
