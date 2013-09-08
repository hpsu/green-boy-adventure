/******************
 * Weapon classes *
 ******************/

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
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(ancestor.x, ancestor.y);
		this.fullPower = this.ancestor.health == this.ancestor.hearts;
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
		this.draw();
	}
	,draw: function() {
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
		
		if (this.acDelta > this.msPerFrame) {
				

			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
		}
		rotation = null;
		switch(this.direction) {
			case 0:
				rotation = 0.5;
				break;
			case 180:
				rotation = 1.5;
				break;
			case 90:
				rotation = 1.0;
				break;
		}
		placeTile(this.sprite, this.x+xAdd, this.y, false, null, rotation);
		
		this.acDelta+=delta;
		this.acTotalDelta+=delta;
		this.lastUpdateTime = Date.now();
	}	
});

var SwordRipplePart = new Class({
	Extends: Mob
	,sprite: 13
	,angle: 0
	,moveRate: 1
	,iterable:0
	,initialize: function(x,y,angle) {
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
		this.draw();
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
	,damage: 0.5
	,msPerFrame: 10
	,palette: 0
	,sprite: 12
	,acImpactMove: 0
	,movementRate:3
	,destroy: function() {
		(function(ancestor){ancestor.swordThrow = null;}).pass(this.ancestor).delay(300);
		this.ancestor.swordThrow = false;
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
		
		

		this.draw();

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();

	}
	,draw: function() {
		rotation = null;
		placeTile(this.sprite, this.x, this.y, false, null, ((this.direction+90)/180%360));
		this.changePalette();
	}
});

/***************
 * Pickupables *
 ***************/
var PickupSword = new Class({
	Extends: Mob
	,isFriendly: true
	,pickup: function(that) {
		console.log('picked up sword');
		that.items.sword = 1;
		this.destroy();
	}
	,draw: function() {
		placeTile(12, this.x, this.y);
	}
});

var Fairy = new Class({
	Extends: Mob
	,width: 16
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
		that.health = that.hearts;
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
		this.draw();
		this.acDelta+=delta;
		this.acDirDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	,draw: function() {
		ctx.drawImage(env.spriteSheet, (this.sprite*TILESIZE)+this.spritePos, 0, HALFTILE, TILESIZE, this.x, this.y, HALFTILE, TILESIZE);
	}
});


var Rupee = new Class({
	Extends: Mob
	,acDelta: 0
	,palette: 2
	,width: 16
	,height: 16
	,msPerFrame: 120
	,isFriendly: true
	,paletteFrames: [2,3]
	,palettePosition: 0
	,lastUpdateTime: 0
	,worth: 1
	,initialize: function(x,y) {
		this.parent(x,y);
		this.isFriendly = true;
		(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.rupees += this.worth;
		this.destroy();
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.palettePosition >= this.paletteFrames.length) this.palettePosition=0;
			this.palette = this.paletteFrames[this.palettePosition++];
		}

		placeTile(70, this.x, this.y);
		this.changePalette();
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var MidRupee = new Class({
	Extends: Rupee
	,paletteFrames: [3]
	,worth: 5
});

var Heart = new Class({
	Extends: Mob
	,acDelta: 0
	,palette: 2
	,width: HALFTILE
	,height: HALFTILE
	,msPerFrame: 150
	,isFriendly: true
	,lastUpdateTime: 0
	,initialize: function(x,y) {
		this.parent(x,y);
		this.isFriendly = true;
		(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.health += 1;
		if(that.health > that.hearts) {
			that.health = that.hearts;
		}
		this.destroy();
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		ctx.drawImage(env.spriteSheet, (22*TILESIZE), 0, HALFTILE, HALFTILE, this.x, this.y, HALFTILE, HALFTILE); // Heart

		this.changePalette(2);
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	
});

var Bomb = new Class({
	Extends: Mob
	,palette: 2
	,width: 16
	,height: 16
	,isFriendly: true
	,initialize: function(x,y) {
		this.parent(x,y);
		this.isFriendly = true;
		(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.bombs += 1;
		this.destroy();
	}
	,draw: function() {
		placeTile(69, this.x, this.y);
	}
});

var font = {
	 a: [ 0, 0],b: [ 1, 0],e: [ 2, 0],f: [ 3, 0],i: [ 4, 0],j: [ 5, 0],m: [ 6, 0],n: [ 7, 0],q: [ 8, 0],r: [ 9, 0],u: [10, 0],v: [11, 0],  y: [12, 0],  z: [13, 0],',': [14, 0],'!': [15, 0],'.': [16, 0],0: [17, 0],3: [18, 0],4: [19, 0],7: [20, 0],8: [21, 0]
	,c: [ 0, 1],d: [ 1, 1],g: [ 2, 1],h: [ 3, 1],k: [ 4, 1],l: [ 5, 1],o: [ 6, 1],p: [ 7, 1],s: [ 8, 1],t: [ 9, 1],w: [10, 1],x: [11, 1],'-': [12, 1],'.': [13, 1],"'": [14, 1],'&': [15, 1],  1: [16, 1],2: [17, 1],5: [18, 1],6: [19, 1],9: [20, 1]
};
