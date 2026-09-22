// Delegation also handles lesson and simulator buttons created after page load.
// Use explicit actions, never eval or inline JavaScript handlers.
const tqActions = {
  showView: value => window.showView(value),
  showProfile: () => showProfile(),
  continueQuest: () => continueQuest(),
  setSide: value => setSide(value),
  placeOrder: () => placeOrder(),
  askCoach: () => askCoach(),
  coachPrompt: value => coachPrompt(value),
  startCheckout: () => startCheckout(),
  closeLesson: () => closeLesson(),
  setAuthMode: value => setAuthMode(value),
  closeProfile: () => closeProfile(),
  resetProgress: () => resetProgress(),
  logout: () => logout(),
  answerDaily: value => answerDaily(value),
  openLesson: value => openLesson(value),
  answerLesson: value => answerLesson(value),
  selectSymbol: value => selectSymbol(value)
};
function syncDialogVisibility() {
  document.querySelectorAll('.modal').forEach(dialog => {
    dialog.setAttribute('aria-hidden', String(!dialog.classList.contains('open')));
  });
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-tq-click]');
  if (!button || button.disabled) return;
  const match = /^([a-zA-Z]+)\((?:'([^']*)'|(true|false)|(\d+))?\)$/.exec(button.dataset.tqClick);
  if (!match || !Object.hasOwn(tqActions, match[1])) return;
  const value = match[2] ?? (match[3] !== undefined ? match[3] === 'true' : match[4] !== undefined ? Number(match[4]) : undefined);
  tqActions[match[1]](value);
  syncDialogVisibility();
});
document.addEventListener('submit', event => {
  if (event.target.matches('[data-tq-auth]')) {
    submitAuth(event);
    syncDialogVisibility();
  }
});
syncDialogVisibility();
