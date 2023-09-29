async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  Telegram.WebApp.BackButton.show();

  const eventId = new URLSearchParams(window.location.search).get("eventId");
  const event = await getEventDetails(eventId);

  displayEvent(event);
  disableLoading();
}
