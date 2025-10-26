// Almacenamiento simple en localStorage
const KEY_NAME = 'crayrunner_name';
const KEY_HS   = 'crayrunner_highscore';

export function getName(){
  const n = localStorage.getItem(KEY_NAME);
  return n && n.trim() ? n.trim() : null;
}
export function setName(name){
  localStorage.setItem(KEY_NAME, String(name).slice(0,16));
}
export function getHighScore(){
  return Number(localStorage.getItem(KEY_HS) || 0);
}
export function setHighScore(score){
  const best = getHighScore();
  if(score > best) localStorage.setItem(KEY_HS, String(score));
}
