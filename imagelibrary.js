var Sprite16 = new Class({
	buffer: null,
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
	,draw: function(tCtx, x, y) {
		if(!this.buffer) this.create();
		tCtx.drawImage(this.buffer, 0, 0, this.width, this.height, Math.round(x), Math.round(y), this.width, this.height);

	}
	,create: function(){
		if(this.buffer) return this.buffer;
		this.buffer = document.createElement('canvas');
		this.buffer.width = 16;
		this.buffer.height = 16;

		this.buffer.getContext('2d').drawImage(
			env.spriteSheet, 
			this.position*SPRITESIZE,
			0,
			this.width,
			this.height,
			0, //dstX
			0, //dstY
			this.width,
			this.height
		);

		// Tint
		if(this.tintFrom) {
			console.log('tinting from',this.tintFrom);
			map = this.buffer.getContext('2d').getImageData(0, 0, this.width, this.height);
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
			this.buffer.getContext('2d').putImageData(map, 0, 0);
		}

		return this.buffer;
	}
});

var imSword = new Sprite16(12);
var imWhiteSword = new Sprite16(12, {fromPalette: 0, toPalette: 3});


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