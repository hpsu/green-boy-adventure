var SpriteCache = {};

var Sprite = new Class({
	buffer: {},
	width: 16,
	height: 16,
	direction: 0,
	initialize: function(position, params){
		this.position = position;
		if(typeof params != 'undefined') {
			if(typeof params.fromPalette != 'undefined') {
				this.tintFrom = env.palettes[params.fromPalette];
				this.tintTo = env.palettes[params.toPalette];
			}
		}
	}
	,hash: function() {

		return Array.slice(arguments).join('.');
	}
	,draw: function(tCtx, x, y, direction, flip, palette) {
		var h = this.hash(direction,flip,palette);
		if(!this.buffer[h]) this.create(direction, flip, palette);
		tCtx.drawImage(this.buffer[h], 0, 0, this.width, this.height, x*SCALE, y*SCALE, Math.round(this.width*SCALE), Math.round(this.height*SCALE));

	}
	,create: function(direction, flip, palette){
		var h = this.hash(direction,flip,palette);
		if(this.buffer[h]) return this.buffer[direction];
		this.buffer[h] = document.createElement('canvas');
		this.buffer[h].width = 16;
		this.buffer[h].height = 16;

		var tmpX = 0, tmpY = 0;
		var tCtx = this.buffer[h].getContext('2d');
		if(direction > 0 || flip) {
			tmpY = this.height/-2;
			tmpX = this.width/-2;
			rotate = (direction/180)*Math.PI;
			tCtx.translate((this.width/2), (this.height/2));
			if(direction > 0) {
				console.log('rotating to',direction);
				tCtx.rotate(rotate);
			}
			if(flip) {
				tCtx.scale((flip.contains('x') ? -1 : 1), (flip.contains('y') ? -1 : 1));
			}
		}

		tCtx.drawImage(
			env.spriteSheet, 
			this.position*SPRITESIZE,
			0,
			this.width,
			this.height,
			tmpX, //dstX
			tmpY, //dstY
			Math.round(this.width),
			this.height
		);

		//palette
		if(palette) {
			console.log('tinting to palette',palette);
			var map = tCtx.getImageData(0, 0, this.width, this.height),
				imdata = map.data
				tintFrom = env.palettes[0]
				tintTo = env.palettes[palette];
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				
				for(var i=0;i<tintFrom.length;i++) {
					if(r == tintFrom[i][0] && g == tintFrom[i][1] && b == tintFrom[i][2]) {
						imdata[p] = tintTo[i][0];
						imdata[p+1] = tintTo[i][1];
						imdata[p+2] = tintTo[i][2];
					}
				}
			}
			tCtx.putImageData(map, 0, 0);
		}

		// Deprecated, remove once all sprites use the same palette
		if(this.tintFrom) {
			console.warn('DEPRECATED - tinting from',this.tintFrom);
			var map = tCtx.getImageData(0, 0, this.width, this.height);
			imdata = map.data;
			for(var p = 0, len = imdata.length; p < len; p+=4) {
				r = imdata[p]
				g = imdata[p+1];
				b = imdata[p+2];
				
				if(this.tintFrom[0] instanceof Array) {
					for(var i=0;i<this.tintFrom.length;i++) {
						if(r == this.tintFrom[i][0] && g == this.tintFrom[i][1] && b == this.tintFrom[i][2]) {
							imdata[p] = this.tintTo[i][0];
							imdata[p+1] = this.tintTo[i][1];
							imdata[p+2] = this.tintTo[i][2];
						}
					}
				}
				else {
					if(r == this.tintFrom[0] && g == this.tintFrom[1] && b == this.tintFrom[2]) {
						imdata[p] = this.tintTo[0];
						imdata[p+1] = this.tintTo[1];
						imdata[p+2] = this.tintTo[2];
					}
				}
			}
			tCtx.putImageData(map, 0, 0);
		}

		return this.buffer[h];
	}
});

var SpriteCatalog = {
	Sword: [12]
	,SwordRipple: [13]

	,Link0: [2,3]// right
	,Link90: [6,7] // down
	,Link180: [0,1] //left
	,Link270: [4,5]
	,LinkItem0: [9]
	,LinkItem90: [11] 
	,LinkItem180: [8]
	,LinkItem270: [10]

	,draw: function(key, x, y, params) {
		if(!params) params = {};

		if(typeof params['direction'] != 'undefined' && this[key+params['direction']]) {
			key = key+params['direction'];
			delete params['direction'];
		}

		if(!this[key]) {
			console.warn('No such sprite in catalog!');
			return false;
		}
		var tCtx = (params['ctx'] ? params['ctx'] : ctx);
		var animFrame = typeof params['animFrame'] != 'undefined' && typeof this[key][params['animFrame']] != 'undefined' ? params['animFrame'] : 0;

		if(!SpriteCache[key+animFrame]) SpriteCache[key+animFrame] = new Sprite(this[key][animFrame]);
		return SpriteCache[key+animFrame].draw(tCtx, x, y, params['direction'], params['flip'], params['palette']);
	}
};

var imSword = new Sprite(12);
var imWhiteSword = new Sprite(12, {fromPalette: 0, toPalette: 3});


function xxplaceTile(frame, x, y, tintFrom, tintTo, rotate, flip, tCtx) {
	if(!tCtx) tCtx = ctx;
	x = Math.round(x*SCALE);
	y = Math.round(y*SCALE);
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
			tCtx.scale((flip.contains('x') ? -1 : 1), (flip.contains('y') ? -1 : 1));
	}
	tCtx.drawImage(env.spriteSheet
		,(frame*SPRITESIZE)
		,0
		,SPRITESIZE, SPRITESIZE, tmpX, tmpY, TILESIZE, TILESIZE);
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
			
			if(tintFrom[0] instanceof Array) {
				for(var i=0;i<tintFrom.length;i++) {
					if(r == tintFrom[i][0] && g == tintFrom[i][1] && b == tintFrom[i][2]) {
						imdata[p] = tintTo[i][0];
						imdata[p+1] = tintTo[i][1];
						imdata[p+2] = tintTo[i][2];
					}
				}
			}
			else {
				if(r == tintFrom[0] && g == tintFrom[1] && b == tintFrom[2]) {
					imdata[p] = tintTo[0];
					imdata[p+1] = tintTo[1];
					imdata[p+2] = tintTo[2];
				}
			}
		}
		TintCache.set(tintTo, frame, map);
		return tCtx.putImageData(map, x, y);
	}
}
