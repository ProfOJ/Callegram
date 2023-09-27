function showStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.remove("hidden");
      break;
    }
  }
}

function hideStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.add("hidden");
      break;
    }
  }
}

function blockStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.add("blocked");
      break;
    }
  }
}

function unblockStep(step) {
  const steps = document.getElementsByClassName("scheduleStep");

  for (const stepEl of steps) {
    if (stepEl.getAttribute("data-step") === `${step}`) {
      stepEl.classList.remove("blocked");
      break;
    }
  }
}
