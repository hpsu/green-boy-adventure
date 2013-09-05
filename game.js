//@TODO: Separate canvas contexts for background + header with lower update rate

// Global vars
var ctx = null
	,WIDTH = 256
	,HEIGHT = 240
	,SCALE = 1
	,TILESIZE = 16
	,HALFTILE = 8
	,solidObjects = []
	,img = new Image()
	,keyStates = {}
	,env = {
	};

var TintCache = {
	cache: {}
	,get: function(color, tile) {
		if(Array.isArray(color)) color = color.rgbToHex();
		if(this.cache[color] && this.cache[color][tile])
			return this.cache[color][tile];
		return false;
	}
	,set: function(color, tile, data) {
		if(Array.isArray(color)) color = color.rgbToHex();
		if(!this.cache[color]) this.cache[color] = {};
		this.cache[color][tile] = data;
	}
};

img.src='sprites.png';

window.addEvent('load', function () {
    ctx = $('screen').getContext('2d');
	ctx.webkitImageSmoothingEnabled=false;
	env.player = new Link(WIDTH/2, HEIGHT/2);
	
	window.requestAnimationFrame(animate);
});

// Record keypresses
window.addEvent('keydown', function(e) { if(keyStates[e.key] !== null) keyStates[e.key] = true; });
window.addEvent('keyup', function(e) { keyStates[e.key] = false; });


/*
 * Base skeleton class for all Mobile OBjects
 */
var Mob = new Class({
	initialize: function(x,y,room){
		this.isFriendly = false;
		if(room)
			this.currentRoom = room
		else
			this.currentRoom = rooms.getCurrentRoom();
		this.currentRoom.MOBs.unshift(this);
		do{
			xTile = Number.random(0, this.currentRoom.roomWidth-1);
			yTile = Number.random(0, this.currentRoom.roomHeight-1);
		} while(this.currentRoom.getTile(yTile, xTile).sprite !== null);
		
		this.x = x ? x : xTile*TILESIZE;
		this.y = y ? y : (yTile+4)*TILESIZE;
	}
	,msPerFrame: 100
	,collidesWith: function(that) {
		var  ax1 = this.x
			,ax2 = this.x+this.width
			,ay1 = this.y
			,ay2 = this.y+this.height
			,bx1 = that.x
			,bx2 = that.x+that.width
			,by1 = that.y
			,by2 = that.y+that.height;
		return (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);

	}
	,impact: function(damage) {
		this.health -= damage;
		if(this.health == 0) {
			this.destroy();
		}
	}
	,destroy: function() {
		this.isActive = false;
		this.currentRoom.MOBs.erase(this);
	}
	,isActive: true
	,move: function() {
		if(rooms.getCurrentRoom() == this.currentRoom)
			this.draw();
	},draw: function() {}
});

var palettes = [
	 [[128, 208,  16], [252, 152,  56], [200,  76,  12]] // green, orange, brown
	,[[  0,   0,   0], [216,  40,   0], [  0, 128, 136]] // black, red, blue
	,[[216,  40,   0], [252, 252, 252], [252, 152,  56]] // red, white, orange
	,[[  0,   0, 168], [252, 252, 252], [ 92, 148, 252]] // dark blue, white, light blue
];


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
					if(r == palettes[2][i][0] && g == palettes[2][i][1] && b == palettes[2][i][2]) {
						imdata[p] = palettes[this.palette][j][0];
						imdata[p+1] = palettes[this.palette][j][1];
						imdata[p+2] = palettes[this.palette][j][2];
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
					if(r == palettes[2][i][0] && g == palettes[2][i][1] && b == palettes[2][i][2]) {
						imdata[p] = palettes[this.palette][j][0];
						imdata[p+1] = palettes[this.palette][j][1];
						imdata[p+2] = palettes[this.palette][j][2];
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

		ctx.drawImage(img, (22*TILESIZE), 0, HALFTILE, HALFTILE, this.x, this.y, HALFTILE, HALFTILE); // Heart

		this.rotatePalette();
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
	
});

function drawPalettes() {
	Array.each(palettes, function(palette) {
		new Element('div', {
			styles:{
				 height:'16px'
				,float:'left'
			}}).set('text', 'Palette').inject(document.body);
		Array.each(palette, function(color) {
			new Element('div', {
				styles:{
					 height:'16px'
					,width:'16px'
					,float:'left'
					,background:color.rgbToHex()
				}}).inject(document.body);
		});
	});
}

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


var EnemyDeath = new Class({
	Extends: Mob
	,acDelta: 0
	,lastUpdateTime: 0
	,animFrame: 0
	,msPerFrame: 30
	,frames: [64, 64, 64, 65, 65, 65, 64, 64, 64, 64]
	,palette: 0
	,rotatePalette: function() {
		if(this.palette > 0) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([1,2], function(i){
					j = i;
					if(r == palettes[0][i][0] && g == palettes[0][i][1] && b == palettes[0][i][2]) {
						if(i == 1) j = 2;
						if(i == 2) j = 1;
						imdata[p] = palettes[this.palette][j][0];
						imdata[p+1] = palettes[this.palette][j][1];
						imdata[p+2] = palettes[this.palette][j][2];
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
			if(typeof this.frames[++this.animFrame] == 'undefined') {
				this.destroy();
				if(Number.random(1,5) == 5) {
					if(Number.random(1,5) == 5)
						new Bomb(this.x, this.y);
					else if(env.player.health < env.player.hearts && Number.random(1,2) == 2)
						new Heart(this.x, this.y);
					else 
						new Rupee(this.x, this.y);
				}
			}
			if(++this.palette > palettes.length-1)
				this.palette=0;
		}

		placeTile(this.frames[this.animFrame-1], this.x, this.y, null, null);
		this.rotatePalette();

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Enemy = new Class({
	Extends: Mob
	,initialize: function(x,y) {
		this.parent(x,y);
	}
	,impact: function(damage) {
		this.health -= damage;
		if(this.health == 0) {
			this.die();
		}
	}
	,die: function() {
		new EnemyDeath(this.x, this.y);
		this.destroy();
	}
	,draw: function() {}
});

var RockProjectile = new Class({
	Extends: Mob
	,damage: 0.5
	,height: 16
	,width: 16
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.parent(this.x,this.y,ancestor.currentRoom);
		this.direction = ancestor.direction;
		this.moveRate = 3.5;
		switch(this.direction) {
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
	,move: function() {
		if(rooms.getCurrentRoom() != this.currentRoom) return;

		var xTile = Math.round(this.x/TILESIZE)
			yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header

		var txTile = Math.round(this.x/HALFTILE)
			tyTile = Math.round(this.y/HALFTILE)-8; // -4 is accounting for the header

		var tmpX=this.x, tmpY=this.y;

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
				this.destroy();
			}
		},this);

		switch(this.direction) {
			case 'left':
				var tmpX = this.x-this.moveRate-(HALFTILE/2);
				var tmpXTile = Math.round(tmpX/TILESIZE);
				if(tmpXTile < 0 || this.currentRoom.getTile(yTile, tmpXTile).isSolid) {
					this.destroy();
					break;
				}

				this.x -= this.moveRate;
				break;
			case 'right':
				var tmpX = this.x+this.moveRate+(HALFTILE/2);
				var tmpXTile = Math.round(tmpX/TILESIZE);
				if(tmpXTile >= this.currentRoom.roomWidth || this.currentRoom.getTile(yTile, tmpXTile).isSolid) {
					this.destroy();
					break;
				}

				this.x += this.moveRate;
				break;
			case 'up':
				var tmpY = this.y-this.moveRate-(HALFTILE/2);
				var tmpYTile = Math.round(tmpY/TILESIZE)-4;
				if(tmpYTile < 0 || this.currentRoom.getTile(tmpYTile, xTile).isSolid) {
					this.destroy(); 
					break;
				}

				this.y -= this.moveRate;
				break;
			case 'down':
				var tmpY = this.y+this.moveRate+(HALFTILE/2);
				var tmpYTile = Math.round(tmpY/TILESIZE)-4;
				if(tmpYTile >= this.currentRoom.roomHeight || this.currentRoom.getTile(tmpYTile, xTile).isSolid) {
					this.destroy();
					break;
				}

				this.y += this.moveRate;
				break;
		}
		this.draw();
	}
	,draw: function() {
		rotation = null;
		switch(this.direction) {
			case 'left':
				rotation = 0.5;
				break;
			case 'right':
				rotation = 1.5;
				break;
			case 'up':
				rotation = 1.0;
				break;
		}
		placeTile(63, this.x, this.y, null, null, rotation);
		
	}	
});

var Octorock = new Class({
	Extends: Enemy
	,width: 16
	,height: 16
	,animFrame: 0
	,lastUpdateTime: 0
	,msPerFrame: 110
	,acDelta: 0
	,damage: 0.5
	,health: 0.5
	,healthPoints: 0.5
	,moveDelta: 0.5
	,dirDelta: 0
	,rockDelta: 0
	,direction: 'down'
	,frames: {
		left: [61,62]
		,right: [61,62]
		,down: [61,62]
		,up: [61,62]
	}
	,move: function() {
		if(rooms.getCurrentRoom() != this.currentRoom) return;
		xTile = Math.round(this.x/TILESIZE);
		yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header
		var delta = Date.now() - this.lastUpdateTime;

		Array.each(solidObjects, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				that.impact(this.damage, this.direction);
			}
		},this);


		if(this.dirDelta > this.msPerFrame*Number.random(16,32)) {
			this.dirDelta = 0;
			this.randomDirection();
		}
		
		if(this.rockDelta > this.msPerFrame*Number.random(32,64)) {
			this.rockDelta = 0;
			new RockProjectile(this);
		}

		switch(this.direction) {
			case 'right':
				var tmpXTile = Math.floor((this.x+this.moveDelta+TILESIZE)/TILESIZE);
				if(tmpXTile != xTile && (tmpXTile >= this.currentRoom.roomWidth || this.currentRoom.getTile(yTile, tmpXTile).isSolid)) {
					this.randomDirection();
					break;
				}
			
				this.x = this.x+this.moveDelta;
				break;

				break;
			case 'left':
				var tmpXTile = Math.floor((this.x-this.moveDelta)/TILESIZE);
				if(tmpXTile != xTile && (tmpXTile < 0 || this.currentRoom.getTile(yTile, tmpXTile).isSolid)) {
					this.randomDirection();
					break;
				}
				this.x = this.x-this.moveDelta;
				break;
			case 'up':
				var tmpYTile = Math.floor((this.y-this.moveDelta)/TILESIZE)-4;
				if(tmpYTile != yTile && (tmpYTile < 0 || this.currentRoom.getTile(tmpYTile,xTile).isSolid)) {
					this.randomDirection();
					break;
				}

				this.y = this.y-this.moveDelta;

				break;
			case 'down':
				var tmpYTile = Math.floor((this.y+this.moveDelta+TILESIZE)/TILESIZE)-4;
				if(tmpYTile != yTile && (tmpYTile >= this.currentRoom.roomHeight || this.currentRoom.getTile(tmpYTile,xTile).isSolid)) {
					this.randomDirection();
					break;
				}

				this.y = this.y+this.moveDelta;
				break;
		}

		this.dirDelta += delta;
		this.rockDelta += delta;
		this.draw();
		this.lastUpdateTime = Date.now();
	}
	,randomDirection: function() {
		directions = ['up', 'right', 'down', 'left'];
		this.direction = directions[Number.random(0,3)];
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') this.animFrame=0;
		}

		frame = this.frames[this.direction][this.animFrame];
		rotation = null;
		switch(this.direction) {
			case 'left':
				rotation = 0.5;
				break;
			case 'right':
				rotation = 1.5;
				break;
			case 'up':
				rotation = 1.0;
				break;
		}
		placeTile(frame, this.x, this.y, null, null, rotation);
		this.acDelta+=delta;

	}
});

var Link = new Class({
	Extends: Mob,
	height: 16,
	width: 16,
	isFriendly: true,
	isImmune: false,
	plDelta: 0,
	paletteFrame: 0,
	rupees: 0,
	keys: 0,
	bombs: 0,
	hearts: 3,
	impactDirection: null,
	initialize: function(x,y) {
		this.currentRoom = rooms.getCurrentRoom();
		this.x=x;
		this.y=y;
		solidObjects.unshift(this);
		this.isFriendly = true;
		this.animFrame = 0;
		this.health = 3;
		this.lastUpdateTime = 0;
		this.acDelta = 0;
		this.moving = false
		this.direction = 'up';
		this.moveDelta = 1.3;
		this.frames = {
			left: [0, 1]
			,right: [2, 3]
			,up: [4, 5]
			,down: [6, 7]		
			,leftItem: [8]
			,rightItem: [9]
			,upItem: [10]
			,downItem: [11]
		};
		this.usingItem = false;
	}
	,impact: function(damage, direction) {
		if(this.isImmune)
			return;
		this.impactDirection = direction;
		this.health -= damage;
		if(this.health <= 0)
			this.die();
		this.isImmune = true;
		(function(){this.isImmune=false}).delay(1000, this);
	}
	,die: function() {
		new EnemyDeath(this.x, this.y);
		this.destroy();
	}
	,destroy: function() {
		this.isActive = false;
		solidObjects.erase(this);
	}
	,flytta: function(direction) {
		xTile = Math.round(this.x/TILESIZE);
		yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header
		var currentRoom = rooms.getCurrentRoom();
		if(window.spriteDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, "#f0f") // debug tile
		if(!direction) direction = this.direction;
		switch(direction) {
			case 'down':
				this.moving = true;
				this.direction = 'down';

				var tmpYTile = Math.floor((this.y+this.moveDelta+TILESIZE)/TILESIZE)-4;
				if(tmpYTile >= currentRoom.roomHeight) {
					if(!rooms.switchRoom(currentRoom.row+1, currentRoom.col)) break;
					this.y = 4*TILESIZE;
					break;
				}
				if(tmpYTile != yTile && currentRoom.getTile(tmpYTile,xTile).isSolid) {
					break;
				}

				this.y = this.y+this.moveDelta;
				break;
			case 'up':
				this.moving = true;
				this.direction = 'up';

				var tmpYTile = Math.floor((this.y-this.moveDelta)/TILESIZE)-4;
				if(tmpYTile < 0) {
					if(!rooms.switchRoom(currentRoom.row-1, currentRoom.col)) break;

					this.y = HEIGHT-TILESIZE;
					break;
				}
				if(tmpYTile != yTile && currentRoom.getTile(tmpYTile,xTile).isSolid) {
					break;
				}

				this.y = this.y-this.moveDelta;
				break;
			case 'right':
				this.moving = true;
				this.direction = 'right';
				var tmpXTile = Math.floor((this.x+this.moveDelta+TILESIZE)/TILESIZE);
				if(tmpXTile >= currentRoom.roomWidth) {
					if(!rooms.switchRoom(currentRoom.row, currentRoom.col+1)) break;
					this.x = 0;
					break;
				}
				if(tmpXTile != xTile && currentRoom.getTile(yTile, tmpXTile).isSolid) {
					break;
				}
			
				this.x = this.x+this.moveDelta;
				break;
			case 'left':
				this.moving = true;
				this.direction = 'left';
				var tmpXTile = Math.floor((this.x-this.moveDelta)/TILESIZE);
				if(tmpXTile < 0) {
					if(!rooms.switchRoom(currentRoom.row, currentRoom.col-1)) break;
					this.x = WIDTH-TILESIZE;
					break;
				}
				if(tmpXTile != xTile && currentRoom.getTile(yTile, tmpXTile).isSolid) {
					break;
				}
				this.x = this.x-this.moveDelta;
				break;
			
		}

		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				if(that.pickup)
					that.pickup(this);
			}
		},this);
		
		
	}
	,move: function() {
		switch(true) {
			case this.isImmune:
				this.flytta(this.impactDirection);

			case this.usingItem != false:
				break;
			case keyStates['space'] && this.usingItem == false:
				this.usingItem = new Sword(this);
				keyStates['space']=null;
				break;
			case keyStates['down']: case keyStates['s']:
				this.flytta('down');
				break;
			case keyStates['up']: case keyStates['w']:
				this.flytta('up');
				break;
			case keyStates['right']: case keyStates['d']:
				this.flytta('right');
				break;
			case keyStates['left']: case keyStates['a']:
				this.flytta('left');
				break;
				

		}
		
		this.draw();		
	}
	,rotateImmunePalette: function() {
		// From [128, 208,  16] Kläder		[  0,   0,   0]	[216,  40,   0] [  0,   0, 168]
		// From [252, 152,  56] Hudfärg		[216,  40,   0] [252, 252, 252] [252, 252, 252]
		// From [200,  76,  12] Hår/skor	[  0, 128, 136] [252, 152,  56] [ 92, 148, 252]
		var paletteData = [
			[]
			,[
				{tintFrom: [128, 208,  16], tintTo: [  0,   0,   0]}
				,{tintFrom: [252, 152,  56], tintTo: [216,  40,   0]}
				,{tintFrom: [200,  76,  12], tintTo: [  0, 128, 136]}
			]
			,[
				{tintFrom: [128, 208,  16], tintTo: [216,  40,   0]}
				,{tintFrom: [252, 152,  56], tintTo: [252, 252, 252]}
				,{tintFrom: [200,  76,  12], tintTo: [252, 152,  56]}
			]
			,[
				{tintFrom: [128, 208,  16], tintTo: [  0,   0, 168]}
				,{tintFrom: [252, 152,  56], tintTo: [252, 252, 252]}
				,{tintFrom: [200,  76,  12], tintTo: [ 92, 148, 252]}
			]
		];

		if(paletteData[this.paletteFrame].length) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
			
				Array.each(paletteData[this.paletteFrame], function(d) {
					if(r == d.tintFrom[0] && g == d.tintFrom[1] && b == d.tintFrom[2]) {
						imdata[p] = d.tintTo[0];
						imdata[p+1] = d.tintTo[1];
						imdata[p+2] = d.tintTo[2];
					}
				});
			}
			ctx.putImageData(map, this.x, this.y);
		}

	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.usingItem) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
			this.acDelta = 0;
			this.usingItem.draw();
			this.animFrame = 0;
		}		
		else if(this.moving && this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') this.animFrame=0;
		}
		frame = this.frames[this.direction+(this.usingItem?'Item':'')][this.animFrame];
		placeTile(frame, this.x, this.y);
	 	if(this.isImmune) {
			if(this.plDelta > this.msPerFrame) {
				this.plDelta = 0;
				if(++this.paletteFrame > 3) this.paletteFrame = 0;
			}
			this.rotateImmunePalette();
		}
		this.acDelta+=delta;
		this.plDelta+=delta;
		this.lastUpdateTime = Date.now();
		this.moving = false;
	}
	
});

function placeTile(frame, x, y, tintFrom, tintTo, rotate) {
	tmpX = x; tmpY = y;
	if(tintTo && TintCache.get(tintTo, frame)) {
		return ctx.putImageData(TintCache.get(tintTo, frame), x, y);
	}
	if(rotate) {
		tmpY = 16/-2;
		tmpX = 16/-2;;
		rotate = rotate*Math.PI;
		ctx.save();
		ctx.translate(x+8, y+8);
		ctx.rotate(rotate);
	}
	ctx.drawImage(img
		,(frame*TILESIZE)
		,0
		,TILESIZE, TILESIZE, tmpX*SCALE, tmpY*SCALE, TILESIZE*SCALE, TILESIZE*SCALE);
	if(rotate) {
		ctx.restore();
	}

	if(tintTo) {
		if(window.spriteDebug || true) console.log('tinting tile '+frame);
		
		map = ctx.getImageData(x, y, TILESIZE, TILESIZE);
		imdata = map.data;
		for(var p = 0, len = imdata.length; p < len; p+=4) {
			r = imdata[p]
			g = imdata[p+1];
			b = imdata[p+2];
			
			if(r == tintFrom[0] && g == tintFrom[1] && b == tintFrom[2]) {
				imdata[p] = tintTo[0];
				imdata[p+1] = tintTo[1];
				imdata[p+2] = tintTo[2];
			}
		}
		TintCache.set(tintTo, frame, map);
		return ctx.putImageData(map, x, y);
	}
}


// 8 x 16

function paintRoom(){
	var room = rooms.getCurrentRoom();
	y = 4, x = 0;
	Array.each(room.getTiles(), function(row) {
		x = 0;
		Array.each(row, function(tile) {
			if(window.spriteDebug) {
				ctx.beginPath();
				ctx.strokeStyle="#f0f";;
				ctx.rect(x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
				ctx.stroke();
			}
			if(tile.sprite) {
				placeTile(tile.sprite, x*TILESIZE, y*TILESIZE, tile.tintFrom, tile.tintTo); // , [0, 168, 0], [200, 76, 12]

			}
			x++;
		});
		y++;
	});
}

/* 
 * Header related code
 * 
 * */

function filledRectangle(x, y, w, h, c) {
	ctx.beginPath();
	ctx.fillStyle=c;
	ctx.rect(x, y, w, h);
	ctx.fill();
}

function paintHeader() {
	var yOff = TILESIZE*1.5,
		xOff = TILESIZE;

	// Background
	filledRectangle(0, 0, 16*TILESIZE, 4*TILESIZE, "#000");

	if(window.spriteDebug) {
		for(var io=0; io<2; io++) {
			for(var i=0; i<16; i++) {
				ctx.beginPath();
				ctx.strokeStyle='#090';
				ctx.rect((i*TILESIZE), yOff+(io*TILESIZE), TILESIZE, TILESIZE);
				ctx.stroke();
			}
		}
	}

	
	// Map
	
	filledRectangle(xOff, yOff, 4*TILESIZE, 2*TILESIZE, "#747474");
	
	sizeX = (4*TILESIZE)/16; // Total levels 8
	sizeY = (2*TILESIZE)/8; // Total rooms 16
	currentRoom = rooms.getCurrentRoom();
	filledRectangle(xOff+(sizeX*currentRoom.col), yOff+(sizeY*currentRoom.row), sizeX, sizeY, "#80d010");
	
	
	// Rupees
	ctx.drawImage(img, (21*TILESIZE), 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff, HALFTILE, HALFTILE); // Rupee
	writeText('X'+env.player.rupees, xOff+(4*TILESIZE)+HALFTILE, yOff); 

	// Keys
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE), HALFTILE, HALFTILE); // Key
	writeText('X'+env.player.keys, xOff+(4*TILESIZE)+HALFTILE, yOff+TILESIZE); 

	// Bombs
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, HALFTILE, HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Bomb
	writeText('X'+env.player.bombs, xOff+(4*TILESIZE)+HALFTILE, yOff+(HALFTILE*3)); 

	drawBorder(xOff+(6*TILESIZE)+HALFTILE, yOff, 3, 4);
	writeText('B', xOff+(6*TILESIZE)+HALFTILE, yOff); 
	drawBorder(xOff+(8*TILESIZE), yOff, 3, 4);
	writeText('A', xOff+(8*TILESIZE), yOff); 

	writeText('-LIFE-', xOff+(10*TILESIZE), yOff, [216, 40, 0]); 
	
	tmpLife = env.player.health;
	for(var i=0; i < env.player.hearts; i++) {
		if(tmpLife >= 1) {
			xAdd = 0;
			yAdd = 0;
		} else if(tmpLife >= 0.5) {
			xAdd = 1;
			yAdd = 0;
		}
		else {
			xAdd = 0;
			yAdd = 1;
		}
		ctx.drawImage(img, (22*TILESIZE)+(xAdd*HALFTILE), yAdd*HALFTILE, HALFTILE, HALFTILE, xOff+(10*TILESIZE)+(i*HALFTILE), yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Heart
		tmpLife--;
	}
}

function writeText(string, x, y, color) {
	var xOff = 0;
	Array.each(string.toLowerCase(), function(c){
		char = font[c];
		if(char) {
			ctx.drawImage(
				img, 
				(23*TILESIZE)+(char[0]*HALFTILE), 
				char[1]*HALFTILE, 
				HALFTILE, 
				HALFTILE, 
				x+(xOff*HALFTILE)+HALFTILE, 
				y, 
				HALFTILE, 
				HALFTILE);
			if(color) {
				map = ctx.getImageData(x+(xOff*HALFTILE)+HALFTILE, y, HALFTILE, HALFTILE);
				imdata = map.data;
				for(var p = 0, len = imdata.length; p < len; p+=4) {
					r = imdata[p]
					g = imdata[p+1];
					b = imdata[p+2];
					
					if(r == 252 && g == 252 && b == 252) {
						imdata[p] = color[0];
						imdata[p+1] = color[1];
						imdata[p+2] = color[2];
					}
					
				}
				ctx.putImageData(map, x+(xOff*HALFTILE)+HALFTILE, y);
				
			}
		}
		xOff++;
	});
}

function drawBorder(x, y, w, h) {
	if(w < 2 || h < 2) { console.error('Too small border size specified'); return false;}
	
	var totalRows = h-2,
		totalCols = w-2
		currentCol = 0,
		currentRow = 0;

	// Top 
	ctx.drawImage(img
		,(50*TILESIZE)
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y
		,HALFTILE, HALFTILE);
		
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(img
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(img
		,(50*TILESIZE)+HALFTILE
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE) 
		,y
		,HALFTILE, HALFTILE);

	currentRow++;

	//Sides  
	for(var i=0; i<totalRows; i++) {
		ctx.drawImage(img
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
		ctx.drawImage(img
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x+HALFTILE+(HALFTILE*totalCols)
			,y+(currentRow++*HALFTILE)
			,HALFTILE, HALFTILE);
	}

	// Bottom
	currentCol=0;
	ctx.drawImage(img
		,(50*TILESIZE)+0
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(img
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(img
		,(50*TILESIZE)+HALFTILE
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);

}

/*
 * Main animation loop
 */
function animate() {
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	paintRoom();
	paintHeader();
	Array.each(solidObjects, function(o){
		if(o.isActive)
			o.move();
	});
	Array.each(rooms.getCurrentRoom().MOBs, function(o){
		if(o.isActive)
			o.move();
	});

	window.requestAnimationFrame(animate);
}

