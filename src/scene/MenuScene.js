export default class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }

  create(){
    const touch=document.getElementById('touch'); if(touch) touch.style.display='none';
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    const W=this.scale.width, H=this.scale.height, CX=W/2;

    this.add.rectangle(CX,H/2,W,H,0x000000);
    this.add.text(CX,H*0.23,'CRAY LDR – GTA Las Viñas',{
      fontFamily:'Courier',fontStyle:'bold',fontSize:Math.round(W*0.058)+'px',color:'#ffcc00'
    }).setOrigin(0.5);
    this.add.text(CX,H*0.29,'by La Zeta Music',{
      fontFamily:'Courier',fontSize:Math.round(W*0.03)+'px',color:'#bbb'
    }).setOrigin(0.5);

    const name=localStorage.getItem('playerName')||'Cray';
    const hi=localStorage.getItem('highScore')||0;
    const info=this.add.text(CX,H*0.38,`Jugador: ${name}\nRécord: ${hi}`,{
      fontFamily:'Courier',fontSize:Math.round(W*0.032)+'px',color:'#ffee99',align:'center'
    }).setOrigin(0.5);

    const makeBtn=(y,label,cb)=>{
      const f=Math.round(W*0.045);
      const t=this.add.text(0,0,label,{fontFamily:'Courier',fontStyle:'bold',fontSize:f+'px',color:'#000'});
      const w=t.width+40,h=t.height+20;
      const bg=this.add.rectangle(0,0,w,h,0xffffff).setStrokeStyle(2,0x222222,0.25);
      const c=this.add.container(CX,y,[bg,t]).setSize(w,h).setInteractive({
        hitArea:new Phaser.Geom.Rectangle(-w/2,-h/2,w,h),
        hitAreaCallback:Phaser.Geom.Rectangle.Contains,useHandCursor:true
      });
      c.on('pointerdown',()=>cb());
    };

    makeBtn(H*0.52,'▶ JUGAR',()=>this.scene.start('GameScene'));
    makeBtn(H*0.64,'👤 CAMBIAR NOMBRE',()=>{
      const n=prompt('Tu nombre:',name);
      if(n){localStorage.setItem('playerName',n);info.setText(`Jugador: ${n}\nRécord: ${hi}`);}
    });
    makeBtn(H*0.76,'🏆 TOP 10',()=>alert('Ranking global pronto disponible.'));
  }
}


