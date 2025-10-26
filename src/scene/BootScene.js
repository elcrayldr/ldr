import { getName, setName } from './storage.js';

export default class BootScene extends Phaser.Scene {
  constructor(){ super({ key:'BootScene' }); }
  create(){
    let name = getName();
    if(!name){
      name = window.prompt('Escribe tu nombre (máx 16 chars):', 'Cray');
      if(!name || !name.trim()) name = 'Guest';
      setName(name);
    }
    this.scene.start('MenuScene');
  }
}
