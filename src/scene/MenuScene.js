export default class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }

  create(){
    const touch=document.getElementById('touch'); if(touch) touch.style.display='none';
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    const W=this.scale.width, H=this.scale.height, CX=W/2;
    this.add.rectangle(CX,H/2,W,H,0x000000);

    this.add.text(CX,H*0.22,'CRAY LDR – GTA Las Viñas',{
      fontFamily:'Courier',fontStyle:'bold',fontSize:Math.round(W*0.06)+'px',color:'#ffcc00'
    }).setOrigin(0.5);
    this.add.text(CX,H*0.29,'by La Zeta Music',{
      fontFamily:'Courier',fontSize:Math.round(W*0.03)+'px',color:'#bbb'
    }).setOrigin(0.5);

    const name=localStorage.getItem('playerName')||'Cray';
    const hi=localStorage.getItem('highScore')||0;
    const info=this.add.text(CX,H*0.37,`Jugador: ${name}\nRécord: ${hi}`,{
      fontFamily:'Courier',fontSize:Math.round(W*0.033)+'px',color:'#ffee99',align:'center'
    }).setOrigin(0.5);

    const makeBigButton=(y,label,cb)=>{
      const f=Math.round(W*0.05);
      const btnW=Math.max(W*0.72, 280);
      const btnH=Math.max(f+28, 64);

      const bg=this.add.rectangle(CX,y,btnW,btnH,0xffffff,1)
        .setStrokeStyle(2,0x222222,0.3)
        .setInteractive({ useHandCursor:true });

      const t=this.add.text(CX,y,label,{
        fontFamily:'Courier',fontStyle:'bold',fontSize:f+'px',color:'#000'
      }).setOrigin(0.5);

      let armed=false;
      bg.on('pointerdown', ()=> armed=true);
      bg.on('pointerup',   ()=> { if(armed) cb(); armed=false; });
      bg.on('pointerout',  ()=> { armed=false; });
    };

    makeBigButton(H*0.52,'▶ JUGAR', ()=> this.scene.start('GameScene'));
    makeBigButton(H*0.64,'👤 CAMBIAR NOMBRE', ()=>{
      const n=prompt('Tu nombre:', name);
      if(n){ localStorage.setItem('playerName',n); info.setText(`Jugador: ${n}\nRécord: ${hi}`); }
    });
    makeBigButton(H*0.76,'🏆 TOP 10', ()=> alert('Ranking global pronto disponible.'));
  }
}



