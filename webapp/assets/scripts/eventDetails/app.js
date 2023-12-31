let popupClosedCallback = null;

async function onDeleteClicked(eventId) {
  Telegram.WebApp.MainButton.showProgress();
  const response = await deleteEvent(eventId);
  Telegram.WebApp.MainButton.hideProgress();

  if (!response.success) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    Telegram.WebApp.showAlert(response.message);
    return;
  }

  Telegram.WebApp.showAlert("Event deleted successfully");
  Telegram.WebApp.BackButton.hide();
  window.location.href = "/";
}

function showConfirmationDialog(confirmationCallback) {
  Telegram.WebApp.showPopup({
    title: "Delete Event",
    message: "Are you sure you want to delete this event?",
    buttons: [
      {
        id: "cancel",
        type: "cancel",
        text: "Cancel",
      },
      {
        id: "delete",
        type: "destructive",
        text: "Delete",
      },
    ],
  });

  if (!popupClosedCallback) {
    popupClosedCallback = (action) => {
      if (action.button_id === "delete") {
        confirmationCallback();
        Telegram.WebApp.onEvent("popupClosed", () => {});
        return;
      }

      // prevent duplicate callbacks if user clicks cancel
      Telegram.WebApp.offEvent("popupClosed", popupClosedCallback);
      popupClosedCallback = null;
    }
  }

  Telegram.WebApp.onEvent("popupClosed", popupClosedCallback);
}

async function main() {
  Telegram.WebApp.expand();
  Telegram.WebApp.BackButton.show();
  Telegram.WebApp.BackButton.onClick(() => {
    Telegram.WebApp.BackButton.hide();
    window.location.href = "/";
  });

  const authData = await authUser();
  if (!authData) {
    return;
  }

  let eventId = new URLSearchParams(window.location.search).get("eventId");
  if (!eventId) {
    eventId = getInitData().start_param;
  }
  const event = await getEventDetails(eventId);

  if (!event) {
    window.location.href = "/";
    return;
  }

  displayEvent(event);
  disableLoading();

  const userId = getUser().id;

  // if current user is owner, hide buttons and show MainButton
  if (event.owner_user_id === userId) {
    const eventActions = document.getElementById("eventActions");
    eventActions.style.display = "none";
    Telegram.WebApp.MainButton.setText("Delete");
    Telegram.WebApp.MainButton.show();
    Telegram.WebApp.MainButton.onClick(() => {
      showConfirmationDialog(() => {
        onDeleteClicked(eventId).then(() => {});
      });
    });
    return;
  }

  const editButton = document.getElementById("editEventButton");
  editButton.addEventListener("click", () => {
    const currentQueryString = window.location.search;
    const newQueryString = new URLSearchParams(currentQueryString);
    newQueryString.set("eventId", eventId);
    Telegram.WebApp.HapticFeedback.impactOccurred("light");
    window.location.href = `/editEvent?${newQueryString}`;
  });

  // no haptic for this one because visual response is immediate
  const deleteButton = document.getElementById("deleteEventButton");
  deleteButton.addEventListener("click", () => {
    showConfirmationDialog(() => {
      onDeleteClicked(eventId).then(() => {});
    });
  });
}
