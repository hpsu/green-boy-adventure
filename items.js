/******************
 * Weapon classes *
 ******************/
var Sword = new Class({
	Extends: Mob
	,damage: 0.5
	,msShown: 200
	,lastUpdateTime: 0
	,acDelta: 0
	,width: 16
	,height: 16
	,frames:{
		left: [12]
		,right: [13]
		,up: [14]
		,down: [15]
	}
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		//this.parent(ancestor.x, ancestor.y);
		this.x = ancestor.x;
		this.y = ancestor.y;
		switch(this.ancestor.direction) {
			case 'left':
				this.x -= 11;
				break;
			case 'right':
				this.x += 11;
				break;
			case 'up':
				this.y -= 11;
				break;
			case 'down':
				this.y += 11;
				break;
		}
	}
	,draw: function() {
		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && !that.isFriendly && this.collidesWith(that)) {
				
				that.impact(this.damage, this.direction);
			}
		},this);

		xAdd = 0;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
		} else if (this.acDelta > this.msShown/2) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
		}
		frame = this.frames[this.ancestor.direction];
		placeTile(frame, this.x+xAdd, this.y);
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}	
});

/***************
 * Pickupables *
 ***************/
var Rupee = new Class({
	Extends: Mob
	,acDelta: 0
	,palette: 2
	,width: 16
	,height: 16
	,msPerFrame: 120
	,isFriendly: true
	,lastUpdateTime: 0
	,initialize: function(x,y) {
		this.parent(x,y);
		this.isFriendly = true;
		(function(){this.destroy();}).delay(10000, this);
	}
	,pickup: function(that) {
		that.rupees += 1;
		this.destroy();
	}
	,rotatePalette: function() {
		if(this.palette != 2) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([1,2], function(i){
					j = i;
					if(r == env.palettes[2][i][0] && g == env.palettes[2][i][1] && b == env.palettes[2][i][2]) {
						imdata[p] = env.palettes[this.palette][j][0];
						imdata[p+1] = env.palettes[this.palette][j][1];
						imdata[p+2] = env.palettes[this.palette][j][2];
					}
				},this);
			}
			ctx.putImageData(map, this.x, this.y);
		}
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		placeTile(70, this.x, this.y);
		this.rotatePalette();
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	
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
	,rotatePalette: function() {
		if(this.palette != 2) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([0], function(i){
					j = i;
					if(r == env.palettes[2][i][0] && g == env.palettes[2][i][1] && b == env.palettes[2][i][2]) {
						imdata[p] = env.palettes[this.palette][j][0];
						imdata[p+1] = env.palettes[this.palette][j][1];
						imdata[p+2] = env.palettes[this.palette][j][2];
					}
				},this);
			}
			ctx.putImageData(map, this.x, this.y);
		}
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
	
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.palette = this.palette == 2 ? 3 : 2;
		}

		ctx.drawImage(env.spriteSheet, (22*TILESIZE), 0, HALFTILE, HALFTILE, this.x, this.y, HALFTILE, HALFTILE); // Heart

		this.rotatePalette();
		
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
