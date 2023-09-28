async function main() {
  const authData = await authUser();
  if (!authData) {
    return;
  }

  populateDays();
  showSection(1);
}
