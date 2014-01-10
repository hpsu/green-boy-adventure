/******************
 * Weapon classes *
 ******************/

var CandleFire = new Class({
	Extends: Mob
	,msShown: 2000
	,flip: 0
	,xAdd: 1
	,msPerFrame: 50
	,msPerOther: 20
	,acShove:0
	,acShown:0
	,sprite: 84
	,initialize: function(ancestor) {
		this.name = 'CandleFire';
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.rePosition();
	}
	,rePosition: function() {
		this.x = this.ancestor.x;
		this.y = this.ancestor.y;
		this.direction = this.ancestor.direction;
		switch(this.direction) {
			case 0:
				this.x += TILESIZE*this.xAdd;
				break;
			case 180:
				this.x -= TILESIZE*this.xAdd;
				break;
			case 270:
				this.y -= TILESIZE*this.xAdd;
				break;
			case 90:
				this.y += TILESIZE*this.xAdd;
				break;
		}
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acShown > this.msShown) {
			this.ancestor.candle = null;
			var xTile = Math.round((this.x)/TILESIZE);
			var yTile = Math.round((this.y)/TILESIZE)-4;

			if(xTile < 0) xTile = 0;
			if(yTile < 0) yTile = 0;
			if(xTile > this.currentRoom.roomWidth-1) xTile=this.currentRoom.roomWidth-1;
			if(yTile > this.currentRoom.roomHeight-1) yTile=this.currentRoom.roomHeight-1;

			this.currentRoom.getTile(yTile,xTile).fire();

			//bomb()
			this.destroy();
		}
		if(this.acShove > this.msPerOther) {
			this.acShove = 0;
			if(this.xAdd <2) {
				this.xAdd += 0.1;
				this.rePosition();
			}
		}
		if(this.acDelta > this.msPerFrame) {
			this.ancestor.usingItem = false;
			this.acDelta = 0;
			this.flip = this.flip ? 0 : 1;
		}
		this.acShove+=delta;
		this.acDelta+=delta;
		this.acShown+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y, null, null, null, (this.flip ? 'x' : null));
	}
});

var Bomb = new Class({
	Extends: Mob
	,msShown: 200
	,msBlowup: 2000
	,isFriendly: true
	,sprite: 122
	,initialize: function(ancestor) {
		this.name = 'Sword';
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.rePosition();
		ancestor.addBombs(-1);
	}
	,destroy: function() {
		new Detonation(this.x-12, this.y-12);
		this.parent();
	}
	,rePosition: function() {
		this.x = this.ancestor.x;
		this.y = this.ancestor.y;
		this.direction = this.ancestor.direction;
		switch(this.direction) {
			case 0:
				this.x += TILESIZE*1.5;
				break;
			case 180:
				this.x -= TILESIZE*1.5;
				break;
			case 270:
				this.y -= TILESIZE*1.5;
				break;
			case 90:
				this.y += TILESIZE*1.5;
				break;
		}
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msBlowup) {
			this.ancestor.bomb = null;
			this.destroy();
		}
		else if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
		} 
		this.acDelta+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
	}
});


var Detonation = new Class({
	Extends: Mob
	,isFriendly: true
	,frame: 0
	,damage: 1
	,msPerFrame: 20
	,width:TILESIZE*2+12
	,height:TILESIZE*2+12
	,acTileSwitchDelta: 0
	,tile: 110
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);

		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && !that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, (180+that.direction)%360, 'bomb');
			}
		},this);


		var xTile = Math.round((this.x+12)/TILESIZE);
		var yTile = Math.round((this.y+12)/TILESIZE)-4;

		if(xTile < 0) xTile = 0;
		if(yTile < 0) yTile = 0;
		if(xTile > this.currentRoom.roomWidth-1) xTile=this.currentRoom.roomWidth-1;
		if(yTile > this.currentRoom.roomHeight-1) yTile=this.currentRoom.roomHeight-1;

		this.currentRoom.getTile(yTile,xTile).bomb();
		if(this.acTileSwitchDelta > 600) {
			this.destroy();
		}
		else if(this.acTileSwitchDelta > 300) {
			this.tile = 111;
		}
		if(this.acDelta > this.msPerFrame) {
			this.acDelta=0;
			if(++this.frame > 1) this.frame=0;
		}
		this.acDelta += delta;
		this.acTileSwitchDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {

		placeTile(this.tile, this.x+14, this.y+14);

		if(this.frame == 0) {
			placeTile(this.tile, this.x-8+14, this.y-14+14);
			placeTile(this.tile, this.x+8+14, this.y+14+14);
			placeTile(this.tile, this.x+14+14, this.y+14);
		}
		else {
			placeTile(this.tile, this.x+8+14, this.y-14+14);
			placeTile(this.tile, this.x-8+14, this.y+14+14);
			placeTile(this.tile, this.x-14+14, this.y+14);
		}



	}

});(this.x, this.y);


var Sword = new Class({
	Extends: Mob
	,damage: 0.5
	,msShown: 200
	,width: 16
	,height: 16
	,sprite: 12
	,direction: 0
	,movementRate: 5
	,isFriendly: true
	,fullPower: false
	,initialize: function(ancestor) {
		this.name = 'Sword';
		this.ancestor = ancestor;
		this.parent(ancestor.x, ancestor.y);
		this.fullPower = this.ancestor.health == this.ancestor.items.hearts;
		this.rePosition();
	}
	,rePosition: function() {
		this.x = this.ancestor.x;
		this.y = this.ancestor.y;
		this.direction = this.ancestor.direction;
		switch(this.direction) {
			case 0:
				this.x += 11;
				this.y += 1;
				break;
			case 180:
				this.x -= 11;
				break;
			case 270:
				this.y -= 11;
				break;
			case 90:
				this.y += 11;
				break;
		}
	}
	,move: function() {
		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && this.collidesWith(that)) {
				if(!that.isFriendly)
					that.impact(this.damage, this.direction);
				else if(that.pickup) {
					that.pickup(this.ancestor);
				}
			}
		},this);

		xAdd = 0;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
			this.destroy();
		} 
		this.rePosition();
		if (this.acDelta > this.msPerFrame) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
		}
		this.acDelta+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		placeTile(this.sprite, this.x+xAdd, this.y, false, null, (90 + this.direction % 360)/180);
	}	
});

var SwordRipplePart = new Class({
	Extends: Mob
	,sprite: 13
	,angle: 0
	,moveRate: 1.3
	,iterable:0
	,isFriendly: true
	,initialize: function(x,y,angle) {
		this.name = 'SwordRipplePart';
		this.parent(x,y);
		this.angle=angle;
	}
	,move: function() {
		this.iterable += this.moveRate;
		if(this.iterable > TILESIZE*2) {
			this.destroy();
		}
		this.x += Math.cos(this.angle * Math.PI/180) * this.moveRate;
		this.y += Math.sin(this.angle * Math.PI/180) * this.moveRate;
		if(++this.palette > env.palettes.length-1)
			this.palette=0;
	}
	,draw: function() {
		flip = null;
		switch(this.angle) {
			case 45:
				flip = 'y';
				break;
			case 135:
				flip = 'xy';
				break;
			case 225:
				flip = 'x';
				break;
			case 270:
				break;
		}
		placeTile(this.sprite, this.x, this.y, null, null, null, flip);
		this.changePalette();
	}
});

var SwordThrow = new Class({
	Extends: Sword
	,name: 'SwordThrow'
	,damage: 0.5
	,msPerFrame: 10
	,palette: 0
	,sprite: 12
	,acImpactMove: 0
	,movementRate:3
	,destroy: function() {
		(function(ancestor){ancestor.swordThrow = null;}).pass(this.ancestor).delay(300);
		this.swordRipple();
		this.parent();
	}
	,swordRipple: function() {
		new SwordRipplePart(this.x,this.y,45);
		new SwordRipplePart(this.x,this.y,135);
		new SwordRipplePart(this.x,this.y,225);
		new SwordRipplePart(this.x,this.y,315);
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.x += sc(Math.cos(this.direction * Math.PI/180) * this.movementRate);
			this.y += sc(Math.sin(this.direction * Math.PI/180) * this.movementRate);

			Array.each(this.currentRoom.MOBs, function(that){
				if(that != this &&  !that.isFriendly && this.collidesWith(that)) {
					if(that.impact(this.damage, this.direction))
						this.destroy();
				}
			},this);

			
			if(this.x > sc((this.currentRoom.roomWidth*TILESIZE)-TILESIZE-HALFTILE)
			|| this.y < sc(TILESIZE*4)
			|| this.x < sc(HALFTILE)
			|| this.y > sc(TILESIZE*14)) {
				this.destroy();
			}
			if(++this.palette > env.palettes.length-1)
				this.palette=0;
		}
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();

	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y, false, null, ((this.direction+90)/180%360));
		this.changePalette();
	}
});

/***************
 * Pickupables *
 ***************/

var puHeartContainer = new Class({
	Extends: Mob
	,name: 'puHeartContainer'
	,sprite: 107
	,isFriendly: true
	,pickup: function(that) {
		that.addHearts(1);
		that.addHealth(1);
		new LinkGainItem(this.sprite);
		this.destroy();
	}

});

var puRedPotion = new Class({
	Extends: Mob
	,name: 'puRedPotionContainer'
	,width:HALFTILE
	,sprite: 108
	,isFriendly: true
	,pickup: function(that) {
		that.items.potions =2;
		new LinkGainItem(this.sprite);
		this.destroy();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE), 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), HALFTILE, TILESIZE);
	}
});

var puBracelet = new Class({
	Extends: Mob
	,name: 'puBracelet'
	,width:HALFTILE
	,sprite: 132
	,isFriendly: true
	,pickup: function(that) {
		that.items.bracelet = 1;
		this.destroy();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE), 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), HALFTILE, TILESIZE);
	}
});

var puSword = new Class({
	Extends: Mob
	,name: 'puSword'
	,sprite: 12
	,isFriendly: true
	,pickup: function(that) {
		that.items.sword = 1;
		new LinkGainItem(this.sprite);
		this.destroy();
	}
});

var puShield = new Class({
	Extends: Mob
	,name: 'puShield'
	,price: 160
	,width: 8
	,sprite: 105
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.shield = 2;
		new LinkGainItem(this.sprite);
		this.currentRoom.killSprites();
	}
	,draw: function() {
		placeTile(this.sprite, this.x, this.y);
		writeText((String(this.price).length < 3 ? ' ' : '') + String(this.price), this.x-TILESIZE+4, this.y+TILESIZE+HALFTILE);

	}
});

var puCompass = new Class({
	Extends: Mob
	,sprite: 127
	,isFriendly: true
	,pickup: function(that) {
		rooms.hasCompass=true;
		this.destroy();
	}
});

var puMap = new Class({
	Extends: Mob
	,sprite: 136
	,isFriendly: true
	,pickup: function(that) {
		rooms.hasMap=true;
		this.destroy();
	}
});

var puBoomerang = new Class({
	Extends: Mob
	,sprite: 141
	,isFriendly: true
});

var puBlueBoomerang = new Class({
	Extends: puBoomerang
	,palette:3
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE), 0, TILESIZE, TILESIZE, this.x, this.y, TILESIZE, TILESIZE); // Heart
		this.changePalette(0);
	}
});

var puTriforce = new Class({
	Extends: Mob
	,sprite: 144
	,isFriendly: true
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE), 0, TILESIZE, TILESIZE, this.x, this.y, TILESIZE, TILESIZE); // Heart
		this.changePalette(2);
	}
});


var puWhiteSword = new Class({
	Extends: Mob
	,sprite: 128
	,isFriendly: true
});
var puKey = new Class({
	Extends: Mob
	,name: 'puKey'
	,price: 100
	,width: 8
	,sprite: 106
	,isFriendly: true
	,initialize: function(x,y,room,price) {
		this.parent(x,y,room);
		if(typeof price != undefined) this.price = price;
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.keys++;
		
		this.destroy();
		if(this.price) {
			new LinkGainItem(this.sprite,0);
			this.currentRoom.killSprites();
		}
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (106*TILESIZE), 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), HALFTILE, TILESIZE);
		if(this.price) writeText(String(this.price), this.x-TILESIZE+4, this.y+TILESIZE+HALFTILE);
	}
});

var puBone = new Class({
	Extends: Mob
	,name: 'puBone'
	,width:HALFTILE
	,sprite: 108
	,price: 100
	,width: 8
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.bone = 1;
		this.currentRoom.killSprites();
		new LinkGainItem(this.sprite, 1);
		this.destroy();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+HALFTILE, 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), HALFTILE, TILESIZE);
		writeText(String(this.price), this.x-TILESIZE+4, this.y+TILESIZE+HALFTILE);
	}
});


var puCandle = new Class({
	Extends: Mob
	,name: 'puCandle'
	,price: 60
	,width: 8
	,sprite: 106
	,isFriendly: true
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.items.candle = 1;
		new LinkGainItem(this.sprite, 1);
		this.currentRoom.killSprites();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+HALFTILE, 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), HALFTILE, TILESIZE);
		writeText(String(this.price), this.x-TILESIZE+4+HALFTILE, this.y+TILESIZE+HALFTILE);
	}

});


var LakeFairy = new Class({
	Extends: Mob
	,name: 'LakeFairy'
	,sprite: 60
	,spritePos: 0
	,width: 8
	,height: 8
	,isFriendly:true
	,msPerFrame: 50
	,heartCount: 0
	,msPerHeart: 250
	,acHeartDelta: 0
	,hearts: []
	,healthMode: false
	,initialize: function(x, y, room) {
		this.parent(x,y,room);
		this.centerY = Math.floor(this.y-(3.25*TILESIZE));
		this.centerX = Math.floor(this.x);
	}
	,move: function() {
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.spritePos = this.spritePos ? 0 : HALFTILE;
		}
		if(this.healthMode && this.acHeartDelta >= this.msPerHeart) {
			this.acHeartDelta = 0;
			env.player.addHealth(0.5);
			if(this.heartCount == 16) {
				Array.each(this.hearts, function(x){
					x.destroy();
				});
			}
			if(this.heartCount++ <8)
				this.hearts.push(new LakeHeart(this.centerX, this.centerY+(2*TILESIZE)));
		}
		this.acDelta+=delta;
		this.acHeartDelta += delta;
		this.lastUpdateTime = Date.now();
	}
	,pickup: function() {
		this.healthMode=true;
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+this.spritePos, 0, HALFTILE, TILESIZE, this.centerX, this.centerY, HALFTILE, TILESIZE);
	}
});

var LakeHeart = new Class({
	Extends: Mob
	,sprite: 22
	,radius: 3.5*TILESIZE
	,angle: 180
	,ocX: 0
	,ocY: 0
	,initialize: function(x,y,room) {
		this.ocY = this.radius*Math.cos(this.angle) + this.y;
		this.ocX = this.radius*Math.sin(this.angle) + this.x;
		this.parent(x,y,room);
	}
	,move: function() {
		this.ocY = this.radius*Math.cos(this.angle) + this.y;
		this.ocX = this.radius*Math.sin(this.angle) + this.x;
		this.angle+=0.05;
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (22*TILESIZE), 0, HALFTILE, HALFTILE, this.ocX, this.ocY, HALFTILE, HALFTILE); // Heart
	}
});

var LakeFairyTrigger = new Class({
	Extends: Mob
	,name: 'LakeFairy'
	,sprite: 60
	,spritePos: 0
	,width: 8
	,height:8
	,msPerFrame: 50

	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.spritePos = this.spritePos ? 0 : HALFTILE;
		}
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+this.spritePos, 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), this.width, this.height);
	}
});

var puFairy = new Class({
	Extends: Mob
	,name: 'Fairy'
	,width: 8
	,height: 16
	,msPerFrame: 10
	,isFriendly: true
	,sprite: 60
	,acDirDelta: 0
	,width: HALFTILE
	,moveRate: 1
	,direction: 0
	,height: TILESIZE
	,spritePos: 0
	,initialize: function(x,y) {
		this.parent(x,y);
		this.isFriendly = true;
		this.randomDirection();
		(function(){this.destroy();}).delay(20000, this);
	}
	,pickup: function(that) {
		that.health = that.items.hearts;
		this.destroy();
	}
	,randomDirection: function() {
		directions = [0, 45, 90, 135, 180, 225, 270, 315];
		this.direction = directions[Number.random(0,directions.length-1)];
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;


		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.spritePos = this.spritePos ? 0 : HALFTILE;

			if(this.acDirDelta > this.msPerFrame*Number.random(64,256)) {
				this.acDirDelta = 0;
				this.randomDirection();
			}


			this.x += Math.cos(this.direction * Math.PI/180) * this.moveRate;
			this.y += Math.sin(this.direction * Math.PI/180) * this.moveRate;

			if(this.x > sc((this.currentRoom.roomWidth*TILESIZE)-TILESIZE-HALFTILE)
			|| this.y < sc(TILESIZE*4)
			|| this.x < sc(HALFTILE)
			|| this.y > sc(TILESIZE*14)) {
				this.x -= Math.cos(this.direction * Math.PI/180) * this.moveRate;
				this.y -= Math.sin(this.direction * Math.PI/180) * this.moveRate;
				this.randomDirection();
			}
		}
		this.acDelta+=delta;
		this.acDirDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+this.spritePos, 0, HALFTILE, TILESIZE, Math.round(this.x), Math.round(this.y), this.width, this.height);
	}
});

var puRupee = new Class({
	Extends: Mob
	,name: 'Rupee'
	,acDelta: 0
	,palette: 2
	,width: 16
	,height: 16
	,msPerFrame: 120
	,isFriendly: true
	,paletteFrames: [2,3]
	,palettePosition: 0
	,lastUpdateTime: 0
	,expiry: 10000
	,worth: 1
	,initialize: function(x,y,room) {
		this.parent(x,y,room);
		this.isFriendly = true;
		if(this.expiry)
			(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.addRupees(this.worth);
		this.destroy();
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.palettePosition >= this.paletteFrames.length) this.palettePosition=0;
			this.palette = this.paletteFrames[this.palettePosition++];
		}

		placeTile(123, this.x, this.y);
		this.changePalette();
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var mmgRupee = new Class({
	Extends: puRupee
	,worth: 10
	,cost: 10
	,text: '-10'
	,static: false
	,expiry: null
	,initialize: function(x,y,room,static,cost){
		if(typeof cost != undefined) this.cost = cost;
		if(static) {
			this.static = true;
			this.pickup = (function(){});
			this.text = 'x';
		}
		else if(this.cost) {
			this.text = '-'+Number(this.cost);
		}
		else this.text = '';
		this.parent(x,y,room);
	}
	,reveal: function(){
		this.text = '';
		if (this.worth != 0)
			this.text = (this.worth > 0 ? '+' : '') + String(this.worth);
		this.pickup = (function(){});
	}
	,pickup: function(that) {
		if(that.getRupees() < this.cost) return;
		Array.each(this.currentRoom.rupees, function(o) {
			o.reveal();
		});
		that.addRupees(this.worth);
	}
	,draw: function() {
		this.parent();
		if(this.static) {
			writeText(this.text, this.x+TILESIZE, this.y+(HALFTILE/2));
		}
		else {
			writeText(this.text, this.x-HALFTILE, this.y+TILESIZE+HALFTILE);
		}
		
	}
	
});

var puMidRupee = new Class({
	Extends: puRupee
	,name: 'MidRupee'
	,paletteFrames: [3]
	,worth: 5
});

var puHeart = new Class({
	Extends: Mob
	,name: 'Heart'
	,acDelta: 0
	,palette: 2
	,width: HALFTILE
	,height: HALFTILE
	,msPerFrame: 150
	,sprite:22
	,isFriendly: true
	,price: null
	,expire: 10000
	,lastUpdateTime: 0
	,initialize: function(x,y,room,expire,price) {
		this.parent(x,y,room);
		if(typeof expire != undefined) this.expire = expire;
		if(typeof price != undefined) this.price = price;
		this.isFriendly = true;
		console.log(this.expire, expire, typeof expire == undefined);
		if(this.expire) (function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}

		that.addHealth(1);
		this.destroy();
		return true;
	}
	,move: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE), 0, HALFTILE, HALFTILE, this.x, this.y, HALFTILE, HALFTILE); // Heart
		this.changePalette(2);
		if(this.price) {
			writeText(String(this.price), this.x-(HALFTILE/2), this.y+TILESIZE+HALFTILE);
		}
	}
	
});

var puBomb = new Class({
	Extends: Mob
	,name: 'Bomb'
	,palette: 2
	,width: 16
	,height: 16
	,worth: 1
	,price: null
	,expire: 10000
	,isFriendly: true
	,initialize: function(x,y,room,expire, worth, price) {
		this.parent(x,y,room);
		if(expire != undefined) this.expire = expire
		if(worth != undefined) this.worth = worth
		if(price != undefined) this.price = price
		
		if(this.expire)
			(function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return false;
			that.addRupees(-this.price);
		}
		that.addBombs(this.worth);
		this.destroy();
		return true;
	}
	,draw: function() {
		placeTile(122, this.x, this.y);
		if(this.price) {
			writeText(' '+String(this.price), this.x-HALFTILE, this.y+TILESIZE+HALFTILE);
		}
	}
});

var puArrow = new Class({
	Extends: Mob
	,name: 'Bomb'

	,palette: 0
	,width: 16
	,height: 16
	,worth: 1
	,price: 80
	,expire: null
	,isFriendly: true
	,initialize: function(x,y,room,expire, worth, price) {
		this.parent(x,y,room);
		if(expire != undefined) this.expire = expire
		if(worth != undefined) this.worth = worth
		if(price != undefined) this.price = price
		
		if(this.expire)
			(function(){this.destroy();}).delay(this.expire, this);
	}
	,pickup: function(that) {
		if(this.price) {
			if(that.getRupees() < this.price) return;
			that.addRupees(-this.price);
		}
		that.items.arrow=1;
		this.destroy();
	}
	,draw: function() {
		placeTile(94, this.x, this.y);
		writeText(' '+String(this.price), this.x-HALFTILE, this.y+TILESIZE+HALFTILE);
		this.changePalette(2);
	}
});

var puBow = new Class({
	Extends: Mob
	,name: 'Bow'
	,sprite: 146
	,width: HALFTILE
});

var font = {
	 a: [ 0, 0],b: [ 1, 0],e: [ 2, 0],f: [ 3, 0],i: [ 4, 0],j: [ 5, 0],m: [ 6, 0],n: [ 7, 0],q: [ 8, 0],r: [ 9, 0],u: [10, 0],v: [11, 0],  y: [12, 0],  z: [13, 0],',': [14, 0],'!': [15, 0],'.': [16, 0],0: [17, 0],3: [18, 0],4: [19, 0],7: [20, 0],8: [21, 0]
	,c: [ 0, 1],d: [ 1, 1],g: [ 2, 1],h: [ 3, 1],k: [ 4, 1],l: [ 5, 1],o: [ 6, 1],p: [ 7, 1],s: [ 8, 1],t: [ 9, 1],w: [10, 1],x: [11, 1],'-': [12, 1],'.': [13, 1],"'": [14, 1],'&': [15, 1],  1: [16, 1],2: [17, 1],5: [18, 1],6: [19, 1],9: [20, 1],'+': [21, 1]
};

var movableBlock = new Class({
	Extends: Mob
	,sprite: 284
	,direction: 0
	,isFriendly: true
	,wasMoved: false
	,canPassThru: function(that, tx, ty) {
		var curDistance = Math.sqrt(Math.pow(this.x-that.x,2) + Math.pow(this.y-that.y,2))
			newDistance = Math.sqrt(Math.pow(this.x-tx,2) + Math.pow(this.y-ty,2));
		if(this.collidesWith(that) && newDistance < curDistance-1) {
			if(!this.wasMoved && (this.direction == '*' || this.direction == that.direction)) {
				this.x += Math.cos(that.direction * Math.PI/180)*TILESIZE;
				this.y += Math.sin(that.direction * Math.PI/180)*TILESIZE;
				this.wasMoved = true;
				this.onMove();
			}
			return false;
		}
		return true;
	}
	,onMove: function(){

	}
});

var Door = new Class({
	Extends: Mob
	,isFriendly: true
	,name: 'Door'
	,x: 0
	,y: 0
	,direction: 0
	,sprite: 298
	,lockedSprite: 298
	,sprites: {
		open: {0: 241, 90: 300, 180: 240, 270: 299}
		,locked: {0: 294, 90: 298, 180: 303, 270: 298}
		,shut: {0: 295, 90: 304, 180: 295, 270: 304}
	}
	,state: 'open'
	,openSprite: 299
	,initialize: function(x,y,room) {
		var xPost = {0: 14*TILESIZE, 90: 7.5*TILESIZE, 180: 1*TILESIZE, 270: 7.5*TILESIZE}
			,yPost = {0: 9*TILESIZE, 90: 13*TILESIZE, 180: 9*TILESIZE, 270: 5*TILESIZE};

		if(!room.doors) room.doors = {};
		room.doors[this.direction] = this;
		this.x = xPost[this.direction];
		this.y = yPost[this.direction];

		this.parent(this.x,this.y,room);
	}
	,canPassThru: function(that, tx, ty) {
		this.unlock(that);
		return this.state == 'open';
	}
	,unlock: function(that) {
		if(this.state == 'locked' && that.items.keys > 0) {
			that.items.keys -= 1; 
			this.state = 'open';
		}
	}
	,draw: function() {
		placeTile(this.sprites[this.state][this.direction], this.x, this.y);
	}
});

var DoorEast = new Class({
	Extends: Door
	,direction: 0
	,canPassThru: function(that, tx, ty) {
		if(tx < this.x-that.width+1 || tx < that.x) return true;

		if(!this.parent(that, tx, ty)) return false;


		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;
		if(tx > this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col+1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col+1);
			that.x = TILESIZE;
			return false;

		}
		return this.state == 'open';
	}
});

var LockedDoorEast = new Class({
	Extends: DoorEast
	,state: 'locked'
});

var ShutDoorEast = new Class({
	Extends: DoorEast
	,state: 'shut'
});

var DoorSouth = new Class({
	Extends: Door
	,direction: 90
	,canPassThru: function(that, tx, ty) {
		if(ty < this.y-that.height+1 || ty < that.y) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty > this.y) {
			if(!rooms.exists(that.currentRoom.row+1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row+1, that.currentRoom.col);
			that.y = 5*TILESIZE;
			return false;
		}

		return this.state == 'open';
	}
});

var LockedDoorSouth = new Class({
	Extends: DoorSouth
	,state: 'locked'
});

var ShutDoorSouth = new Class({
	Extends: DoorSouth
	,state: 'shut'
});

var DoorWest = new Class({
	Extends: Door
	,direction: 180
	,canPassThru: function(that, tx, ty) {
		if(tx > this.x + this.width-1 || tx > that.x) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(ty < this.y-5 || ty+that.height > this.y+this.height+5) return false;

		if(tx < this.x) {
			if(!rooms.exists(that.currentRoom.row, that.currentRoom.col-1)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row, that.currentRoom.col-1);
			that.x = (that.currentRoom.roomWidth-1)*TILESIZE-TILESIZE;
			return false;

		}
		return this.state == 'open';
	}
});

var LockedDoorWest = new Class({
	Extends: DoorWest
	,state: 'locked'
});
var ShutDoorWest = new Class({
	Extends: DoorWest
	,state: 'shut'
});


var DoorNorth = new Class({
	Extends: Door
	,direction: 270
	,canPassThru: function(that, tx, ty) {
		if(ty > this.y + this.height-1 || ty > that.y) return true;

		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty < this.y) {
			if(!rooms.exists(that.currentRoom.row-1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row-1, that.currentRoom.col);
			that.y = (that.currentRoom.roomHeight+4-1)*TILESIZE-TILESIZE;
			return false;
		}

		return this.state == 'open';
	}
});
var LockedDoorNorth = new Class({
	Extends: DoorNorth
	,state: 'locked'
});
var ShutDoorNorth = new Class({
	Extends: DoorNorth
	,state: 'shut'
});

var BombHole = new Class({
	Extends: Mob
	,isFriendly: false
	,x: 0
	,y: 0
	,direction: 0
	,sprites: {90: 301, 270: 297}
	,hasBeenBombed: false
	,initialize: function(x,y,room) {
		var xPost = {0: 14*TILESIZE, 90: 7.5*TILESIZE, 180: 1*TILESIZE, 270: 7.5*TILESIZE}
			,yPost = {0: 9*TILESIZE, 90: 13*TILESIZE, 180: 9*TILESIZE, 270: 5*TILESIZE};
		this.x = xPost[this.direction];
		this.y = yPost[this.direction];

		this.parent(this.x,this.y,room);
	}
	,canPassThru: function(that, tx, ty) {
		if(!that.collidesWith(this, tx, ty)) return false;
		return this.hasBeenBombed;
	}
	,impact: function(that, damage, type) {
		this.hasBeenBombed = true;
		this.isFriendly = true;
	}
	,draw: function() {
		if(this.hasBeenBombed) {
			placeTile(this.sprites[this.direction], this.x, this.y);
		}
	}
});
var BombHoleNorth = new Class({
	Extends: BombHole
	,direction: 270
	,canPassThru: function(that, tx, ty) {
		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty < this.y) {
			if(!rooms.exists(that.currentRoom.row-1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row-1, that.currentRoom.col);
			that.y = (that.currentRoom.roomHeight+4-1)*TILESIZE-TILESIZE;
			return false;
		}

		return this.hasBeenBombed;
	}
});

var BombHoleSouth = new Class({
	Extends: BombHole
	,direction: 90
	,canPassThru: function(that, tx, ty) {
		if(!this.parent(that, tx, ty)) return false;

		if(tx < this.x-5 || tx+that.width > this.x+this.width+5) return false;
		if(ty > this.y) {
			if(!rooms.exists(that.currentRoom.row+1, that.currentRoom.col)) {console.log('Room not found');return false;}
			that.currentRoom = switchRoom(that.currentRoom.row+1, that.currentRoom.col);
			that.y = 5*TILESIZE;
			return false;
		}

		return this.hasBeenBombed;
	}
});
