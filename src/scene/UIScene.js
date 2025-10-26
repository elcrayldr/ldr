export default class UIScene extends Phaser.Scene {
  constructor(){ super({ key:'UIScene', active:false }); }
  create(){
    this.gs = this.scene.get('GameScene');
    this.scoreText = this.add.text(16,16,'Score: 0',{ font:'20px monospace', fill:'#fff' }).setDepth(50);
    this.killsText = this.add.text(16,44,'Kills: 0',{ font:'18px monospace', fill:'#fff' }).setDepth(50);
    this.starsText = this.add.text(16,72,'Stars: 0',{ font:'18px monospace', fill:'#ffd700' }).setDepth(50);
    this.hpText    = this.add.text(16,100,'Vida: 100',{ font:'18px monospace', fill:'#ff6b6b' }).setDepth(50);
  }
  update(){
    const s=this.gs; if(!s) return;
    this.scoreText.setText(`Score: ${Math.floor(s.score)}`);
    this.killsText.setText(`Kills: ${s.kills}`);
    this.starsText.setText(`Stars: ${s.stars}`);
    this.hpText.setText(`Vida: ${Math.max(0, Math.round(s.playerHP))}`);
  }
}
