export default class MenuScene extends Phaser.Scene {
  constructor(){ super({ key:'MenuScene' }); }

  create(){
    // Oculta overlays HTML y asegura el canvas activo
    const touch = document.getElementById('touch'); if (touch) touch.style.display = 'none';
    const go = document.getElementById('go'); if (go) go.style.display = 'none';
    this.sys.game.canvas.style.pointerEvents = 'auto';

    const W = this.scale.width, H = this.scale.height, CX = W/2;

    this.add.rectangle(CX, H/2, W, H, 0x000000);
    this.add.text(CX, H*0.25, 'CRAY LDR - GTA Las Viñas', {
      fontFamily:'Courier, monospace', fontStyle:'bold', fontSize:Math.round(W*0.055)+'px', color:'#ffcc00'
    }).setOrigin(0.5);
    this.add.text(CX, H*0.32, 'Online Leaderboard', {
      fontFamily:'Courier, monospace', fontSize:Math.round(W*0.03)+'px', color:'#bbbbbb'
    }).setOrigin(0.5);

    const name = localStorage.getItem('playerName') || 'Cray';
    const hi   = Number(localStorage.getItem('highScore') || 0);
    const info = this.add.text(CX, H*0.40, `Jugador: ${name}\nRécord personal: ${hi}`, {
      fontFamily:'Courier, monospace', fontSize:Math.round(W*0.032)+'px', color:'#ffee99', align:'center'
    }).setOrigin(0.5);

    const makeButton = (y, label, onClick)=>{
      const f = Math.round(W*0.045);
      const t = this.add.text(0,0,label,{fontFamily:'Courier, monospace',fontStyle:'bold',fontSize:f+'px',color:'#000'});
      const w = t.width + 40, h = t.height + 20;
      const bg = this.add.rectangle(0,0,w,h,0xffffff,1).setStrokeStyle(2,0x222222,0.25);
      const c = this.add.container(CX,y,[bg,t]).setSize(w,h);
      c.setInteractive({ hitArea:new Phaser.Geom.Rectangle(-w/2,-h/2,w,h), hitAreaCallback:Phaser.Geom.Rectangle.Contains, useHandCursor:true });
      let armed = false;
      c.on('pointerdown', ()=> armed = true);
      c.on('pointerup',   ()=> { if (armed) onClick(); armed=false; });
      return c;
    };

    makeButton(H*0.52,'▶ JUGAR', ()=>{
      if (this.scene.isActive('GameScene')) return;
      this.scene.start('GameScene');
    });

    makeButton(H*0.64,'👤 CAMBIAR NOMBRE', ()=>{
      const nuevo = prompt('Escribe tu nombre:', name);
      if (nuevo){ localStorage.setItem('playerName', nuevo); info.setText(`Jugador: ${nuevo}\nRécord personal: ${hi}`); }
    });

    makeButton(H*0.76,'🏆 TOP 10', ()=> alert('El ranking global se muestra al finalizar una partida.'));
  }
}

