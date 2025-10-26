export function getName() {
  return localStorage.getItem('playerName') || 'Cray';
}
export function setName(n) {
  if (n) localStorage.setItem('playerName', n);
}
export function getHighScore() {
  return Number(localStorage.getItem('highScore') || 0);
}
export function setHighScore(score) {
  const hi = getHighScore();
  if (score > hi) localStorage.setItem('highScore', String(score));
}
