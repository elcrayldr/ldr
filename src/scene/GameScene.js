function solid(scene,key,color,w,h){
  if(scene.textures.exists(key))return;
  const g=scene.make.graphics({x:0,y:0,add:false});
  g.fillStyle(color,1).fillRect(0,0,w,h);
  g.generateTexture(key,w,h); g.destroy();
}

const SCALE={player:2.3,enemy:2.1,obst:2.1,bullet:1.6};
const SPEED={road:240,enemy:150,obst:170,bullet:520,enemyBullet:320};
const DMG={obst:2,enemyBullet:3};
const MUSIC_VOL=0.25;

export default class GameScene extends Phaser.Scene{
  constructor(){super('GameScene');}

  preload(){
    this.load.setPath('/assets/');
    ['player','police','obst','bullet','enemyBullet','line'].forEach(i=>this.load.image(i,`${i}.png`));
    this.load.audio('music','music.wav');
  }

  create(){
    const go=document.getElementById('go'); if(go) go.style.display='none';
    this.sys.game.canvas.style.pointerEvents='auto';

    ['player','police','obst','bullet','enemyBullet','line']
      .forEach(k=>solid(this,k,0xffffff,20,20));

    this.music=this.sound.add('music',{loop:true,volume:MUSIC_VOL});
    if(!this.sound.locked)this.music.play();
    else this.sound.once(Phaser.Sound.Events.UNLOCKED,()=>this.music.play());

    const touch=document.getElementById('touch');
    if(touch){touch.style.display='block';touch.style.pointerEvents='none';
      touch.querySelectorAll('.btn').forEach(b=>b.style.pointerEvents='auto');}

    const W=this.scale.width,H=this.scale.height,CX=W/2;
    this.W=W;this.H=H;
    this.add.rectangle(CX,H/2,W,H,0x000000);
    const roadW=Math.min(W*0.78,980);
    this.add.rectangle(CX,H/2,roadW,H,0x555555);
    this.road=this.add.group();
    for(let y=-80;y<H+80;y+=80)this.road.add(this.add.image(CX,y,'line'));
    this.roadSpeed=SPEED.road;
    const gap=roadW/3; this.lanes=[CX-gap,CX,CX+gap];

    this.playerLane=1;
    this.player=this.physics.add.image(this.lanes[1],H-260,'player')
      .setScale(SCALE.player).setImmovable(true);
    this.hp=100;this.score=0;this.kills=0;this.gameOver=false;
    this.hScore=this.add.text(12,12,'Score: 0',{font:'20px Courier',fill:'#fff'});
    this.hHP=this.add.text(12,36,'Vida: 100',{font:'20px Courier',fill:'#f66'});

    this.obstacles=this.physics.add.group();
    this.cops=this.physics.add.group();
    this.bullets=this.physics.add.group();
    this.enemyBullets=this.physics.add.group();

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keys=this.input.keyboard.addKeys('A,D,SPACE');

    const bind=(id,cb)=>{
      const el=document.getElementById(id);
      if(!el)return;['mousedown','mouseup','touchstart','touchend']
        .forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();cb(ev==='mousedown'||ev==='touchstart');},{passive:false}));
    };
    bind('left',v=>this._left=v);bind('right',v=>this._right=v);bind('fire',v=>{if(v)this.shoot();});
    this.input.keyboard.on('keydown-SPACE',()=>this.shoot());

    this.physics.add.overlap(this.player,this.obstacles,()=>this.hit(DMG.obst));
    this.physics.add.overlap(this.player,this.enemyBullets,()=>this.hit(DMG.enemyBullet));
    this.physics.add.overlap(this.bullets,this.cops,(b,e)=>{b.destroy();e.health-=50;if(e.health<=0){this.kills++;e.destroy();}});

    this.time.addEvent({delay:900,loop:true,callback:()=>this.spawnWave()});
  }

  shoot(){
    const b=this.bullets.create(this.player.x,this.player.y-26,'bullet')
      .setScale(SCALE.bullet).setVelocityY(-SPEED.bullet);
  }

  hit(d){
    if(this.hp<=0)return; this.hp-=d;
    this.player.setTintFill(0xff4444); this.time.delayedCall(100,()=>this.player.clearTint());
    if(this.hp<=0)this.endRun();
  }

  spawnWave(){
    const lane=Phaser.Math.Between(0,2);
    const x=this.lanes[lane],y=-Phaser.Math.Between(60,160);
    if(Math.random()<0.6)this.spawnEnemy(x,y);else this.spawnObst(x,y);
  }

  spawnEnemy(x,y){
    const e=this.cops.create(x,y,'police').setScale(SCALE.enemy);
    e.health=100;e.setVelocityY(SPEED.enemy);
    this.time.addEvent({delay:Phaser.Math.Between(1300,1800),loop:true,callback:()=>{
      if(!e.active)return;
      const b=this.enemyBullets.create(e.x,e.y+20,'enemyBullet').setScale(SCALE.bullet);
      b.setVelocityY(SPEED.enemyBullet);
    }});
  }

  spawnObst(x,y){this.obstacles.create(x,y,'obst').setScale(SCALE.obst).setVelocityY(SPEED.obst);}

  update(){
    if(this.gameOver)return;
    this.score+=0.16;
    this.hScore.setText('Score: '+Math.floor(this.score));
    this.hHP.setText('Vida: '+Math.max(0,Math.floor(this.hp)));

    this.road.children.each(n=>{n.y+=this.roadSpeed/60;if(n.y>this.H+80)n.y-=(Math.ceil((this.H+160)/80))*80;});

    const L=this.cursors.left.isDown||this.keys.A.isDown||this._left;
    const R=this.cursors.right.isDown||this.keys.D.isDown||this._right;
    if(!this._cd){if(L&&this.playerLane>0)this.playerLane--;
      else if(R&&this.playerLane<2)this.playerLane++;
      this._cd=true;this.time.delayedCall(120,()=>this._cd=false);}
    this.player.x+=(this.lanes[this.playerLane]-this.player.x)*0.5;

    this.bullets.children.each(b=>{if(b.y<-20)b.destroy();});
    this.enemyBullets.children.each(b=>{if(b.y>this.H+20)b.destroy();});
    this.cops.children.each(e=>{if(e.y>this.H+40)e.destroy();});
    this.obstacles.children.each(o=>{if(o.y>this.H+40)o.destroy();});
  }

  endRun(){
    if(this.gameOver)return; this.gameOver=true;
    this.physics.pause(); if(this.music)this.music.stop();
    const go=document.getElementById('go'),score=Math.floor(this.score);
    document.getElementById('goScore').textContent=`Puntuación: ${score}`;
    go.style.display='flex'; this.sys.game.canvas.style.pointerEvents='none';
    const change=(fn)=>{try{this.sys.game.canvas.style.pointerEvents='auto';go.style.display='none';fn();}catch{location.reload();}};
    document.getElementById('goMenu').onclick=()=>change(()=>this.scene.start('MenuScene'));
    document.getElementById('goRetry').onclick=()=>change(()=>this.scene.restart());
  }
}

