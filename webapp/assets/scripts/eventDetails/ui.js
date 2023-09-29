function displayEvent(event) {
  const eventDate = new Date(event.appointment_time + "Z");

  const eventDateElement = document.getElementById("eventDateTime");
  eventDateElement.innerText = eventDate.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const eventUserNameElement = document.getElementById("eventUserName");
  const userId = getUser().id;
  const isOwner = event.owner_user_id === userId;
  eventUserNameElement.innerText = isOwner
    ? event.invited_user.name
    : event.owner_user.name;

  const eventDurationElement = document.getElementById("eventDuration");

  // duration to text. Example - "30 min". Duration is ISO timeframe
  const durationText = `${+event.duration.slice(2, -1) / 60} min`;
  eventDurationElement.innerText = durationText;
}

function disableLoading() {
  const loadingElements = document.getElementsByClassName("loading");

  [...loadingElements].forEach((element) => {
    element.classList.remove("loading");
  });
}
