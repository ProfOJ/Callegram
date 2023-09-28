async function main() {
  const authData = await authUser();

  if (authData) {
    const welcomeMessage = document.getElementById("welcomeMessage");
    welcomeMessage.innerHTML = `Welcome ${authData.user.name}!`;
    stopLoading();
  }
}
