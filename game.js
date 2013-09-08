//@TODO: Separate canvas contexts for background + header with lower update rate

// Global vars
var ctx = null
	,ctxBg = null
	,WIDTH = 256
	,HEIGHT = 240
	,SCALE = 1
	,TILESIZE = 16
	,HALFTILE = 8
	,solidObjects = []
	,env = {
		keyStates: {}
		,paused: false
		,spriteSheet: new Image()
		,palettes: [
			 [[128, 208,  16], [200,  76,  12], [252, 152,  56]] // green, orange, brown (link)
			,[[  0,   0,   0], [216,  40,   0], [  0, 128, 136]] // black, red, blue
			,[[216,  40,   0], [252, 252, 252], [252, 152,  56]] // red, white, orange
			,[[  0,   0, 168], [252, 252, 252], [ 92, 148, 252]] // dark blue, white, light blue
		]
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

env.spriteSheet.src='sprites.png';

window.addEvent('load', function () {
    ctx = $('screen').getContext('2d');
    ctxBg = $('background').getContext('2d');
	ctx.webkitImageSmoothingEnabled=false;
	ctxBg.webkitImageSmoothingEnabled=false;
	env.player = new Link(WIDTH/2, HEIGHT/2);
	
	paintRoom();
	window.requestAnimationFrame(animate);
});

// Record keypresses
window.addEvent('keydown', function(e) { if(env.keyStates[e.key] !== null) env.keyStates[e.key] = true; });
window.addEvent('keyup', function(e) { env.keyStates[e.key] = false; });



/*
 * Base skeleton class for all Mobile OBjects
 */
var Mob = new Class({
	initialize: function(x,y,room){
		if(room)
			this.currentRoom = room
		else
			this.currentRoom = rooms.getCurrentRoom();
		this.currentRoom.MOBs.unshift(this);
		
		this.moveToRandomNonSolidTile(x,y);
	}
	,isFriendly: false
	,moveToRandomNonSolidTile: function(x, y) {
		if(x && y) {
			if(x) this.x = x;
			if(y) this.y = y;
		}
		else {
			var infCnt = 0;
			do{
				if(x)  {
					xTile = Math.round(x/TILESIZE)
					this.x = x;
				}
				else
					xTile = Number.random(1, this.currentRoom.roomWidth-2);
				if(y) {
					yTile = Math.round(y/TILESIZE)-4; // -4 is accounting for the header
					this.y = y;
				}
				else
					yTile = Number.random(1, this.currentRoom.roomHeight-2);

				if(!x) this.x = xTile*TILESIZE;
				if(!y) this.y = (yTile+4)*TILESIZE;

				if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, this.width, this.height, "#f0f");
				if(++infCnt >100)
					return false;

			} while(this.currentRoom.getTile(yTile, xTile).sprite !== null || this.collidesWith(env.player));
			return true;
		}
	}
	,msPerFrame: 100
	,lastUpdateTime: 0
	,isImmune: false
	,width: TILESIZE
	,height: TILESIZE
	,health: 0.5
	,palette: 0
	,frames: []
	,acDelta: 0
	,acImpactMove: 0
	,lastUpdatedTime: 0
	,changePalette: function(fromPalette) {
		if(!fromPalette) fromPalette = 0;
		if(this.palette != fromPalette) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([0,1,2], function(i){
					j = i;
					if(r == env.palettes[fromPalette][i][0] && g == env.palettes[fromPalette][i][1] && b == env.palettes[fromPalette][i][2]) {
						imdata[p] = env.palettes[this.palette][j][0];
						imdata[p+1] = env.palettes[this.palette][j][1];
						imdata[p+2] = env.palettes[this.palette][j][2];
					}
				},this);
			}
			ctx.putImageData(map, this.x, this.y);
		}
	}
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
	,impact: function(damage, direction) {
		if(this.isImmune)
			return;
		this.impactDirection = direction;
		this.acImpactMove = 0;
		this.health -= damage;
		if(this.health <= 0)
			this.die();
		this.isImmune = true;
		(function(){this.isImmune=false}).delay(1000, this);
	}
	,die: function() {
	}
	,destroy: function() {
		this.isActive = false;
		this.currentRoom.MOBs.erase(this);
	}
	,isActive: true
	,move: function() {
		if(rooms.getCurrentRoom() == this.currentRoom)
			this.draw();
	},draw: function() {
		
	}
});

var SwordEvent = new Class({
	initialize: function(room) {
		//@TODO: Freeze player movement during event
		room.tmpX = env.player.x;
		room.tmpY = env.player.y;
		room.addEvent('leave', function() {
			env.player.y = this.tmpY;
			env.player.x = this.tmpX;
			console.log(this);
			for(var i=0; i < this.MOBs.length; i++) {
				var mob = this.MOBs[i];
				this.MOBs.splice(i);
				mob.destroy();
			}
			room.removeEvents('leave');
			room.addEvent('leave',  room.onLeave);
		});
		env.player.y = (11+4-1)*TILESIZE;
		env.player.x = TILESIZE*7;
		env.player.direction=270;
		new Fire(TILESIZE*5, TILESIZE*8, room);
		new Fire(TILESIZE*10, TILESIZE*8, room);
		
		if(env.player.items.sword == 0) {
			new WiseMan((TILESIZE*7)+HALFTILE, TILESIZE*8, room);
			new PickupSword((TILESIZE*7)+HALFTILE, (TILESIZE*10)-HALFTILE, room);
			new TextContainer(TILESIZE*3, (TILESIZE*6)+HALFTILE, room, "it's dangerous to go\n  alone! take this.");
		}
		Array.each(room.tiles[4], function(tile) {
			tile.isSolid = true;
		});
	}
	,tmpX: null
	,tmpY: null
});

var TextContainer = new Class({
	Extends: Mob
	,msPerFrame: 80
	,initialize: function(x, y, room, text) {
		this.parent(x,y,room)
		this.x = x;
		this.y = y;
		this.animFrame=0;
		this.text = text;
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(["\n"," "].contains(this.text[this.animFrame])) this.animFrame++;
			if(++this.animFrame > this.text.length) this.animFrame = this.text.length;
		}
		writeText(this.text.substr(0,this.animFrame), this.x, this.y);
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Fire = new Class({
	Extends: Mob
	,flip: 0
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;
		if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			this.flip = this.flip ? 0 : 1;
		}
		var rotation = this.flip ? 0.5 : null;
		placeTile(84, this.x, this.y, null, null, null, (this.flip ? 'x' : null));
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var WiseMan = new Class({
	Extends: Mob
	,draw: function() {
		placeTile(85, this.x, this.y);
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
	,changePalette: function() {
		if(this.palette > 0) {
			map = ctx.getImageData(this.x, this.y, TILESIZE, TILESIZE);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				Array.each([1,2], function(i){
					j = i;
					if(r == env.palettes[0][i][0] && g == env.palettes[0][i][1] && b == env.palettes[0][i][2]) {
						if(i == 1) j = 2;
						if(i == 2) j = 1;
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
			if(typeof this.frames[++this.animFrame] == 'undefined') {
				this.destroy();
				if(Number.random(1,5) == 5) {
					if(Number.random(1,5) == 5)
						new Bomb(this.x, this.y);
					else if(Number.random(1,5) == 5)
						new MidRupee(this.x, this.y);
					else if(env.player.health < env.player.hearts && Number.random(1,2) == 2)
						new Heart(this.x, this.y);
					else 
						new Rupee(this.x, this.y);
				}
			}
			if(++this.palette > env.palettes.length-1)
				this.palette=0;
		}

		placeTile(this.frames[this.animFrame-1], this.x, this.y, null, null);
		this.changePalette();

		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}
});

var Link = new Class({
	Extends: Mob
	,isFriendly: true
	,paletteFrame: 0
	,rupees: 0
	,keys: 0
	,bombs: 0
	,hearts: 3
	,animFrame: 0
	,health: 3
	,direction: 270
	,moving: false
	,movementRate: 1.3
	,impactDirection: null
	,items: {
		 sword: 0
		,boomerang: 0
		,bow: 0
	}
	,initialize: function(x,y) {
		this.currentRoom = rooms.getCurrentRoom();
		this.x=x;
		this.y=y;
		solidObjects.unshift(this);
		this.moveDelta = 1.3;
		this.frames = {
			 0:		{normal: [2, 3], item: [9]}		// Right
			,90:	{normal: [6, 7], item: [11]}	// Down
			,180:	{normal: [0, 1], item: [8]}		// Left
			,270:	{normal: [4, 5], item: [10]}	// Up
		};
		this.usingItem = false;
	}
	,impact: function(damage, direction) {
		if(this.moving) {
			direction = (180+this.direction)%360;
			console.log('skuffa direction',direction);
		}
		this.parent(damage, direction);
	}
	,die: function() {
		new EnemyDeath(this.x, this.y);
		this.destroy();
	}
	,destroy: function() {
		this.isActive = false;
		solidObjects.erase(this);
	}
	,flytta: function(direction, showDirection) {
		xTile = Math.round(this.x/TILESIZE);
		yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header
		var currentRoom = rooms.getCurrentRoom();
		if(window.spriteDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, "#f0f") // debug tile
		if(direction == null) direction = this.direction;
		else if(showDirection) this.direction = direction;
		if(showDirection) this.moving=true;

		var xTile = this.x/TILESIZE;
		var yTile = (this.y/TILESIZE)-4; // -4 is accounting for the header
		switch(this.direction) {
			case 0: // right
				xTile = Math.ceil(xTile);
				yTile = Math.round(yTile)
				break;
			case 180: // left
				xTile = Math.floor(xTile);
				yTile = Math.round(yTile);
				break;
			case 90: // down
				xTile = Math.round(xTile);
				yTile = Math.ceil(yTile);
				break;
			case 270:
			case -90: // up
				xTile = Math.round(xTile);
				yTile = Math.floor(yTile);
				break;
		}

		if(window.collisionDebug) filledRectangle(this.x, this.y, this.width, this.height, '#f00');
		if(window.collisionDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, '#00f');

		switch(true) {
			case xTile < 0:
				if(this.moving) {
					this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col-1);
					this.x = (this.currentRoom.roomWidth-1)*TILESIZE;
				}
				return;
			case xTile > this.currentRoom.roomWidth-1:
				if(this.moving) {
					this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col+1);
					this.x = 0;
				}
				return;
			case yTile < 0:
				if(this.moving) {
					this.currentRoom = switchRoom(this.currentRoom.row-1, this.currentRoom.col);
					this.y = (this.currentRoom.roomHeight+4-1)*TILESIZE;
				}
				return;
			case yTile > this.currentRoom.roomHeight-1:
				if(this.moving) {
					if(rooms == underworld) {
						this.currentRoom = switchRoom(this.currentRoom.row, this.currentRoom.col, overworld);
					}
					else {
						this.currentRoom = switchRoom(this.currentRoom.row+1, this.currentRoom.col);
						this.y = 4*TILESIZE;
					}
				}
				return;
			case this.currentRoom.getTile(yTile,xTile).isSolid && !window.godMode:
				return;
				
		}
		this.currentRoom.getTile(yTile,xTile).fireEvent('enter');

		Array.each(rooms.getCurrentRoom().MOBs, function(that){
			if(that != this && that.isFriendly && this.collidesWith(that)) {
				if(that.pickup)
					that.pickup(this);
			}
		},this);


		this.x += Math.cos(direction * Math.PI/180) * this.movementRate;
		this.y += Math.sin(direction * Math.PI/180) * this.movementRate;
	}
	,move: function() {
		if(this.isImmune && this.impactDirection !== null && this.acImpactMove < 2*TILESIZE) {
			if(!isNaN(this.impactDirection)) {
				this.flytta(this.impactDirection, false);
				this.acImpactMove += this.movementRate;
			}
			else {
				console.log('Failed to skuffa', this.impactDirection);
			}
			
		}
		
		switch(true) {
			case this.usingItem != false:
				break;
			case env.keyStates['space'] && this.usingItem == false:
				if(this.items.sword > 0) {
					this.usingItem = new Sword(this);
				}
				env.keyStates['space']=null;
				break;
			case env.keyStates['down']: case env.keyStates['s']:
				this.flytta(90, true);
				break;
			case env.keyStates['up']: case env.keyStates['w']:
				this.flytta(270, true);
				break;
			case env.keyStates['right']: case env.keyStates['d']:
				this.flytta(0, true);
				break;
			case env.keyStates['left']: case env.keyStates['a']:
				this.flytta(180, true);
				break;
		}
		
		this.draw();		
	}
	,draw: function() {
		var delta = Date.now() - this.lastUpdateTime;

		if(this.usingItem) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)
			this.acDelta = 0;
			this.usingItem.draw();
			this.animFrame = 0;
		}		
		else if(this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(this.isImmune) {
				if(++this.palette > 3) this.palette = 0;
			}
			if(this.moving)
				if(typeof this.frames[this.direction]['normal'][++this.animFrame] == 'undefined') this.animFrame=0;
		}
		frame = this.frames[this.direction][(this.usingItem?'item':'normal')][this.animFrame];
		if(window.collisionDebug) filledRectangle(this.x, this.y, this.width, this.height, "#0f0");
		placeTile(frame, this.x, this.y);
	 	if(this.isImmune) {
			this.changePalette();
		}
		this.acDelta += delta;
		this.lastUpdateTime = Date.now();
		this.moving = false;
	}
	
});

/* 
 * Header related code
 * 
 * */

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
	ctx.drawImage(env.spriteSheet, (21*TILESIZE), 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff, HALFTILE, HALFTILE); // Rupee
	writeText('X'+env.player.rupees, xOff+(4*TILESIZE)+TILESIZE, yOff); 

	// Keys
	ctx.drawImage(env.spriteSheet, (21*TILESIZE)+HALFTILE, 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE), HALFTILE, HALFTILE); // Key
	writeText('X'+env.player.keys, xOff+(4*TILESIZE)+TILESIZE, yOff+TILESIZE); 

	// Bombs
	ctx.drawImage(env.spriteSheet, (21*TILESIZE)+HALFTILE, HALFTILE, HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Bomb
	writeText('X'+env.player.bombs, xOff+(4*TILESIZE)+TILESIZE, yOff+(HALFTILE*3)); 

	drawBorder(xOff+(6*TILESIZE)+HALFTILE, yOff, 3, 4);
	writeText('B', xOff+(6*TILESIZE)+TILESIZE, yOff); 
	drawBorder(xOff+(8*TILESIZE), yOff, 3, 4);
	writeText('A', xOff+(8*TILESIZE)+HALFTILE, yOff); 
	if(env.player.items.sword > 0) {
		placeTile(12, xOff+(8*TILESIZE)+(HALFTILE/2), yOff+HALFTILE);
	}

	writeText('-LIFE-', xOff+(10*TILESIZE)+HALFTILE, yOff, [216, 40, 0]); 
	
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
		ctx.drawImage(env.spriteSheet, (22*TILESIZE)+(xAdd*HALFTILE), yAdd*HALFTILE, HALFTILE, HALFTILE, xOff+(10*TILESIZE)+(i*HALFTILE), yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Heart
		tmpLife--;
	}
}

/**************************
 * Paint helper functions *
 **************************/

function paintRoom(){
	var room = rooms.getCurrentRoom();
	ctxBg.clearRect(0,0,WIDTH*SCALE,HEIGHT*SCALE);
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
				placeTile(tile.sprite, x*TILESIZE, y*TILESIZE, tile.tintFrom, tile.tintTo, null, null, ctxBg);
			}
			x++;
		});
		y++;
	});
}

function placeTile(frame, x, y, tintFrom, tintTo, rotate, flip, tCtx) {
	if(!tCtx) tCtx = ctx;
	tmpX = x; tmpY = y;
	if(tintTo && TintCache.get(tintTo, frame)) {
		return tCtx.putImageData(TintCache.get(tintTo, frame), x, y);
	}
	if(rotate || flip) {
		tmpY = 16/-2;
		tmpX = 16/-2;;
		rotate = rotate*Math.PI;
		tCtx.save(); 
		tCtx.translate(x+8, y+8);
		if(rotate)
			tCtx.rotate(rotate);
		if(flip)
			tCtx.scale((flip=='x' ? -1 : 1), (flip=='y' ? -1 : 1));
	}
	tCtx.drawImage(env.spriteSheet
		,(frame*TILESIZE)
		,0
		,TILESIZE, TILESIZE, tmpX*SCALE, tmpY*SCALE, TILESIZE*SCALE, TILESIZE*SCALE);
	if(rotate || flip) {
		tCtx.restore();
	}

	if(tintTo) {
		map = tCtx.getImageData(x, y, TILESIZE, TILESIZE);
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
		return tCtx.putImageData(map, x, y);
	}
}

function filledRectangle(x, y, w, h, c) {
	ctx.beginPath();
	ctx.fillStyle=c;
	ctx.rect(x, y, w, h);
	ctx.fill();
}

function writeText(string, x, y, color, tCtx) {
	if(!tCtx) tCtx = ctx;
	var xOff = 0;
	Array.each(string.toLowerCase(), function(c){
		if(c == "\n") {
			y+= HALFTILE;
			xOff = 0;
			return;
		}
		char = font[c];
		if(char) {
			tCtx.drawImage(
				env.spriteSheet, 
				(23*TILESIZE)+(char[0]*HALFTILE), 
				char[1]*HALFTILE, 
				HALFTILE, 
				HALFTILE, 
				x+(xOff*HALFTILE), 
				y, 
				HALFTILE, 
				HALFTILE);
			if(color) {
				map = tCtx.getImageData(x+(xOff*HALFTILE), y, HALFTILE, HALFTILE);
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
				tCtx.putImageData(map, x+(xOff*HALFTILE), y);
				
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
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y
		,HALFTILE, HALFTILE);
		
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+HALFTILE
		,0
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE) 
		,y
		,HALFTILE, HALFTILE);

	currentRow++;

	//Sides  
	for(var i=0; i<totalRows; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+HALFTILE
			,0
			,HALFTILE, HALFTILE
			,x+HALFTILE+(HALFTILE*totalCols)
			,y+(currentRow++*HALFTILE)
			,HALFTILE, HALFTILE);
	}

	// Bottom
	currentCol=0;
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+0
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);
	for(var i=0; i<totalCols; i++) {
		ctx.drawImage(env.spriteSheet
			,(51*TILESIZE)+0
			,0
			,HALFTILE, HALFTILE
			,x+(currentCol++*HALFTILE) 
			,y+(currentRow*HALFTILE)
			,HALFTILE, HALFTILE);
	}
	ctx.drawImage(env.spriteSheet
		,(50*TILESIZE)+HALFTILE
		,HALFTILE
		,HALFTILE, HALFTILE
		,x+(currentCol++*HALFTILE)
		,y+(currentRow*HALFTILE)
		,HALFTILE, HALFTILE);

}

/*********************
 * Utility functions *
 *********************/
function drawPalettes() {
	Array.each(env.palettes, function(palette) {
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

function drawNumberedTiles() {
	for(var i = 0; i < Math.ceil(env.spriteSheet.width/TILESIZE); i++) {
		var x = new Element('canvas', {width: 16, height: 24, styles: {border:'1px dotted magenta',margin:'1px'}}).inject(document.body);
		tCtx = x.getContext('2d');
		tCtx.drawImage(env.spriteSheet
			,(i*TILESIZE)
			,0
			,TILESIZE, TILESIZE
			,0
			,0
			,TILESIZE, TILESIZE);
		t = i.toString();
		writeText(i.toString(), (t.length == 1 ? HALFTILE/2 : 0), TILESIZE, null, tCtx);
	}
}

/***********************
 * Main animation loop *
 ***********************/
function animate() {
	if(!env.paused) {
		ctx.clearRect(0,0,WIDTH*SCALE,HEIGHT*SCALE);
		paintHeader();
		Array.each(solidObjects, function(o){
			if(o.isActive)
				o.move();
		});
		Array.each(rooms.getCurrentRoom().MOBs, function(o){
			if(o.isActive)
				o.move();
		});
	}

	window.requestAnimationFrame(animate);
}
