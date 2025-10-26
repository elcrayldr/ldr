// src/storage.js
const KEY_NAME = 'playerName';
const KEY_HI   = 'highScore';

export function getName() {
  return localStorage.getItem(KEY_NAME) || 'Cray';
}
export function setName(n) {
  if (n) localStorage.setItem(KEY_NAME, n);
}

export function getHighScore() {
  return Number(localStorage.getItem(KEY_HI) || 0);
}
export function setHighScore(score) {
  const hi = getHighScore();
  if (score > hi) localStorage.setItem(KEY_HI, String(score));
}
