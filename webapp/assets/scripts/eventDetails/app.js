async function onDeleteClicked(eventId) {
  const response = await deleteEvent(eventId);
  if (!response.success) {
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

  Telegram.WebApp.onEvent("popupClosed", (action) => {
    if (action.button_id === "delete") {
      confirmationCallback();
      Telegram.WebApp.onEvent("popupClosed", () => {});
    }
  });
}

async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  Telegram.WebApp.BackButton.show();
  Telegram.WebApp.BackButton.onClick(() => {
    Telegram.WebApp.BackButton.hide();
    window.location.href = "/";
  });

  let eventId = new URLSearchParams(window.location.search).get("eventId");
  if (!eventId) {
    eventId = getInitData().start_param;
  }
  const event = await getEventDetails(eventId);

  displayEvent(event);
  disableLoading();

  const userId = getUser().id;

  // if current user is owner, hide buttons and show MainButton
  if (event.owner_user_id === userId) {
    const eventActions = document.getElementById("eventActions");
    eventActions.style.display = "none";
    Telegram.WebApp.MainButton.show();
    Telegram.WebApp.MainButton.setText("Delete");
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
    window.location.href = `/editEvent?${newQueryString}`;
  });

  const deleteButton = document.getElementById("deleteEventButton");
  deleteButton.addEventListener("click", () => {
    showConfirmationDialog(() => {
      onDeleteClicked(eventId).then(() => {});
    });
  });
}
