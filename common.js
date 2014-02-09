// Global vars
var ctx = null
	,ctxBg = null
	,WIDTH = 256
	,HEIGHT = 240
	,SCALE = 1
	,TILESIZE = 16
	,HALFTILE = 8
	,SPRITESIZE = 16
	,HALFSPRITE = 8
	,YOFF = 0
	,solidObjects = []
	,env = {
		keyStates: {}
		,pauseScreen: null
		,paused: false
		,spriteSheet: new Image()
		,bossSpriteSheet: new Image()
		,palettes: {
			main: [
				 [[128, 208,  16], [252, 152,  56], [200,  76,  12]] // green, orange, brown (link)
				,[[  0,   0,   0], [  0, 128, 136], [216,  40,   0]] // black, red, blue
				,[[216,  40,   0], [252, 152,  56], [252, 252, 252]] // red, white, orange
				,[[  0,   0, 168], [ 92, 148, 252], [252, 252, 252]] // dark blue, white, light blue
			]
			,dungeon: [
				[[0,232,216],[0, 128, 136],[24, 60, 92]]	// Dungeon 1
				,[[92, 148, 252],[32, 56, 236],[0,0,168]]	// Dungeon 2
				,[[88,248,152],[0, 144, 56],[0, 60, 20]]	// Dungeon 3
			    ,[[240,188,60],[136, 112, 0],[64, 44, 0]]	// Dungeon 6
			]
		}
	};

window.collisionDebug = false;
window.debugGrid = false;
window.godMode = false;
window.spriteCatalogDebug = false;

env.spriteSheet.src='sprites.png';
env.bossSpriteSheet.src = 'boss_sprites.png';

function setCanvasSize() {
	if(true)
		bs = document.body.getSize();
	else
		bs = {x: 256, y: 240};
	if(bs.x > bs.y)	{
		SCALE = Math.floor((bs.y/240)*16)/16;
	}
	else {

		SCALE = Math.floor((bs.x/256)*16)/16;
	}
	bs.x = 256*SCALE;
	bs.y = 240*SCALE;

	WIDTH = Math.round(bs.x);
	HEIGHT = Math.round(bs.y);

	$('screen').width = WIDTH;
	$('screen').height = HEIGHT;
	$('background').width = WIDTH;
	$('background').height = HEIGHT;
	

	TILESIZE = Math.round(16*SCALE);
	HALFTILE = Math.round(TILESIZE/2);

	ctxBg.webkitImageSmoothingEnabled=false;
	ctx.webkitImageSmoothingEnabled=false;
}

function filledRectangle(x, y, w, h, c, tCtx, stroked) {
	if(!tCtx) tCtx = ctx;
	tCtx.beginPath();
		tCtx.lineWidth=2;
	if(stroked === true){
		tCtx.strokeStyle=c;
		tCtx.strokeRect(x*SCALE, y*SCALE, w*SCALE, h*SCALE);
		tCtx.stroke();
	}
	else {
		tCtx.fillStyle=c;
		tCtx.fillRect(x*SCALE, y*SCALE, w*SCALE, h*SCALE);
//		tCtx.fill();
	}
}

/**************************
 * Paint helper functions *
 **************************/

function writeText(string, x, y, palette, tCtx) {
	if(!tCtx) tCtx = ctx;
	var xOff = 0;
	Array.each(string.toLowerCase(), function(c){
		if(c == "\n") {
			y+= HALFSPRITE;
			xOff = 0;
			return;
		}
		var params = {ctx: tCtx};
		if(typeof palette != 'undefined') {
			params['palette'] = palette;
		}
		if(SpriteCatalog[c])
			SpriteCatalog.draw(c, x+(xOff*HALFSPRITE), y, params);
		xOff++;
	});
}

function drawBorder(x, y, w, h, tCtx) {
	if(w < 2 || h < 2) { console.error('Too small border size specified'); return false;}

	if(typeof tCtx == 'undefined') tCtx = ctx;
	var totalRows = h-2,
		totalCols = w-2
		currentCol = 0,
		currentRow = 0;

	// Top 
	SpriteCatalog.draw('TopLeftBorder', x+(currentCol++*SPRITESIZE),y, {ctx: tCtx});
	for(var i=0; i<totalCols; i++) {
		SpriteCatalog.draw('HorizontalBorder', x+(currentCol++*HALFSPRITE),y, {ctx: tCtx});
	}
	SpriteCatalog.draw('TopRightBorder', x+(currentCol++*HALFSPRITE),y, {ctx: tCtx});

	currentRow++;

	//Sides  
	for(var i=0; i<totalRows; i++) {
		SpriteCatalog.draw('VerticalBorder', x,y+(currentRow*HALFSPRITE), {ctx: tCtx});
		SpriteCatalog.draw('VerticalBorder', x+HALFSPRITE+(HALFSPRITE*totalCols),y+(currentRow++*HALFSPRITE), {ctx: tCtx});
	}

	// Bottom
	currentCol=0;
	SpriteCatalog.draw('BottomLeftBorder', x+(currentCol++*HALFSPRITE),y+(currentRow*HALFSPRITE), {ctx: tCtx});
	for(var i=0; i<totalCols; i++) {
		SpriteCatalog.draw('HorizontalBorder', x+(currentCol++*HALFSPRITE),y+(currentRow*HALFSPRITE), {ctx: tCtx});
	}
	SpriteCatalog.draw('BottomRightBorder', x+(currentCol++*HALFSPRITE),y+(currentRow*HALFSPRITE), {ctx: tCtx});
}
