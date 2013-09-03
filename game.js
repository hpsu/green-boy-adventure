//@TODO: Separate canvas contexts for background + header with lower update rate




// Global vars
var canvas = null
	,ctx = null
	,WIDTH=256
	,HEIGHT=240
	,TILESIZE = 16
	,HALFTILE = 8
	,XTILES = 16
	,YTILES = 10
	,solidObjects = []
	,img = new Image()
	,keyStates = {},
	env = {
		rupees: 0,
		keys: 0,
		bombs: 0,
		life: 3,
		hearts: 3,
		room: 7,
		level: 7
	};


img.src='sprites.png';

window.addEvent('load', function () {
    canvas = $("screen");
    ctx = canvas.getContext("2d");
    //ctx.webkitImageSmoothingEnabled = false;
    //ctx.scale(2, 2); // Won't work with getImageDate which we need to tint images
   
	new Link(WIDTH/2, HEIGHT/2);
	
	window.requestAnimationFrame(animate);
});

// Record keypresses
window.addEvent('keydown', function(e) { if(keyStates[e.key] !== null) keyStates[e.key] = true; });
window.addEvent('keyup', function(e) { keyStates[e.key] = false; });


/*
 * Base skeleton class for all Mobile OBjects
 */
var Mob = new Class({
	initialize: function(x,y){
		solidObjects.unshift(this);
		this.x = x ? x : Math.floor((Math.random()*WIDTH)+1);
		this.y = y ? y : Math.floor((Math.random()*HEIGHT)+1);
	}
	,move: function() {
		this.draw();
	},draw: function() {}
});

var Link = new Class({
	Extends: Mob,
	initialize: function(x,y) {
		this.parent(x,y);
		this.animFrame = 0;
		this.lastUpdateTime = 0;
		this.msPerFrame = 100;
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
	,move: function() {
		xTile = Math.round(this.x/TILESIZE);
		yTile = Math.round(this.y/TILESIZE)-4; // -4 is accounting for the header
		if(window.spriteDebug) filledRectangle(xTile*TILESIZE, (yTile+4)*TILESIZE, TILESIZE, TILESIZE, "#f0f") // debug tile
		switch(true) {
			case this.usingItem != false:
				break;
			case keyStates['space'] && this.usingItem == false:
				this.usingItem = new Sword(this);
				keyStates['space']=null;
				break;
			case keyStates['down']: case keyStates['s']:
				this.moving = true;
				this.direction = 'down';

				var tmpYTile = Math.floor((this.y+this.moveDelta+TILESIZE)/TILESIZE)-4;
				if(tmpYTile > YTILES) {
					if(!rooms[env.level+1] || !rooms[env.level+1][env.room]) break;
					env.level++;
					this.y = 4*TILESIZE;
					break;
				}
				if(tmpYTile != yTile && rooms[env.level][env.room][tmpYTile][xTile] && rooms[env.level][env.room][tmpYTile][xTile] > -1) {
					break;
				}

				this.y = this.y+this.moveDelta;
				break;
			case keyStates['up']: case keyStates['w']:
				this.moving = true;
				this.direction = 'up';

				var tmpYTile = Math.floor((this.y-this.moveDelta)/TILESIZE)-4;
				if(tmpYTile < 0) {
					if(!rooms[env.level-1] || !rooms[env.level-1][env.room]) break;
					env.level--;
					this.y = HEIGHT-TILESIZE;
					break;
				}
				if(tmpYTile != yTile && rooms[env.level][env.room] && rooms[env.level][env.room][tmpYTile][xTile] && rooms[env.level][env.room][tmpYTile][xTile] > -1) {
					break;
				}

				this.y = this.y-this.moveDelta;
				break;

			case keyStates['right']: case keyStates['d']:
				this.moving = true;
				this.direction = 'right';
				var tmpXTile = Math.floor((this.x+this.moveDelta+TILESIZE)/TILESIZE);
				if(tmpXTile > XTILES) {
					if(!rooms[env.level][env.room+1]) break;
					env.room++;
					this.x = 0;
					break;
				}
				if(tmpXTile != xTile && rooms[env.level][env.room][yTile][tmpXTile] && rooms[env.level][env.room][yTile][tmpXTile] > -1) {
					break;
				}
			
				this.x = this.x+this.moveDelta;
				break;
			case keyStates['left']: case keyStates['a']:
				this.moving = true;
				this.direction = 'left';
				var tmpXTile = Math.floor((this.x-this.moveDelta)/TILESIZE);
				if(tmpXTile < 0) {
					if(!rooms[env.level][env.room-1]) break;
					env.room--;
					this.x = WIDTH-TILESIZE;
					break;
				}
				if(tmpXTile != xTile && rooms[env.level][env.room][yTile][tmpXTile] && rooms[env.level][env.room][yTile][tmpXTile] > -1) {
					break;
				}
				this.x = this.x-this.moveDelta;
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
		else if(this.moving && this.acDelta > this.msPerFrame) {
			this.acDelta = 0;
			if(typeof this.frames[this.direction][++this.animFrame] == 'undefined') this.animFrame=0;
		}
		frame = this.frames[this.direction+(this.usingItem?'Item':'')][this.animFrame];
		ctx.drawImage(img, (frame*TILESIZE), 0,TILESIZE, TILESIZE, this.x, this.y, TILESIZE, TILESIZE);
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
		this.moving = false;
	}
	
});

function placeTile(frame, x, y) {
	// @ TODO: Finish this and implement
		ctx.drawImage(
			img, 
			(frame*TILESIZE), 
			0, 
			TILESIZE, TILESIZE, this.x, this.y, TILESIZE, TILESIZE);
}


// 8 x 16

function paintRoom(){
	var room = rooms[env.level][env.room];
	y = 4, x = 0;
	Array.each(room, function(row) {
		x = 0;
		Array.each(row, function(column) {
			if(window.spriteDebug) {
				ctx.beginPath();
				ctx.strokeStyle="#f0f";;
				ctx.rect(x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
				ctx.stroke();
			}
			if(column > -1) {
				ctx.drawImage(img, (column*TILESIZE), 0,TILESIZE, TILESIZE, x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
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
	filledRectangle(xOff+(sizeX*env.room), yOff+(sizeY*env.level), sizeX, sizeY, "#80d010");
	
	
	// Rupees
	ctx.drawImage(img, (21*TILESIZE), 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff, HALFTILE, HALFTILE); // Rupee
	writeText('X'+env.rupees, xOff+(4*TILESIZE)+HALFTILE, yOff); 

	// Keys
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, 0,HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE), HALFTILE, HALFTILE); // Key
	writeText('X'+env.keys, xOff+(4*TILESIZE)+HALFTILE, yOff+TILESIZE); 

	// Bombs
	ctx.drawImage(img, (21*TILESIZE)+HALFTILE, HALFTILE, HALFTILE, HALFTILE, xOff+(4*TILESIZE)+HALFTILE, yOff+(TILESIZE*1.5), HALFTILE, HALFTILE); // Bomb
	writeText('X'+env.bombs, xOff+(4*TILESIZE)+HALFTILE, yOff+(HALFTILE*3)); 

	drawBorder(xOff+(6*TILESIZE)+HALFTILE, yOff, 3, 4);
	writeText('B', xOff+(6*TILESIZE)+HALFTILE, yOff); 
	drawBorder(xOff+(8*TILESIZE), yOff, 3, 4);
	writeText('A', xOff+(8*TILESIZE), yOff); 

	writeText('-LIFE-', xOff+(10*TILESIZE), yOff, [216, 40, 0]); 
	
	tmpLife = env.life;
	for(var i=0; i < env.hearts; i++) {
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
		o.move();
	});

	window.requestAnimationFrame(animate);
}

