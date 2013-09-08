/******************
 * Weapon classes *
 ******************/
var Sword = new Class({
	Extends: Mob
	,damage: 0.5
	,msShown: 200
	,lastUpdateTime: 0
	,acDelta: 0
	,acTotalDelta: 0
	,width: 16
	,height: 16
	,sprite: 12
	,movementRate: 1.3
	,fullPower: false
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(ancestor.x, ancestor.y);
		this.fullPower = this.ancestor.health == this.ancestor.hearts;
		switch(this.ancestor.direction) {
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
			if(that != this && !that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.ancestor.direction);
			}
		},this);

		xAdd = 0;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acTotalDelta > this.msShown) {
			this.ancestor.usingItem = false;
			this.destroy();
		} else if (this.acDelta > this.msPerFrame) {
			if(this.acDelta > this.msShown) {
				if(this.fullPower) {
					this.x += Math.cos(this.ancestor.direction * Math.PI/180) * this.movementRate;
					this.y += Math.sin(this.ancestor.direction * Math.PI/180) * this.movementRate;
				}
				
			}

			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
		}
		rotation = null;
		switch(this.ancestor.direction) {
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
