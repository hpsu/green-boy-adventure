var Sword = new Class({
	Extends: Mob
	,initialize: function(ancestor) {
		this.ancestor = ancestor;
		//this.parent(ancestor.x, ancestor.y);
		this.x = ancestor.x;
		this.y = ancestor.y;
		this.msShown = 200;
		this.lastUpdateTime = 0;
		this.acDelta = 0;
		this.frames = {
			left: [12]
			,right: [13]
			,up: [14]
			,down: [15]
		};
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
		xAdd = 0;
		var delta = (this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : 0);
		if(this.acDelta > this.msShown) {
			this.ancestor.usingItem = false;
		} else if (this.acDelta > this.msShown/2) {
			//@TODO: Link should animate when subtracting the sword (walking frames from right to left)

		}
		frame = this.frames[this.ancestor.direction];
		ctx.drawImage(img, (frame*16), 0,16, 16, this.x+xAdd, this.y, 16, 16);
		
		this.acDelta+=delta;
		this.lastUpdateTime = Date.now();
	}	
});
