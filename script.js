var secPerFrame = 1 / 24,
	secPerUpdate = secPerFrame,
	msPerFrame = 1000 / 24,
	msPerUpdate = 1000 / 24,
	SVGNS = 'http://www.w3.org/2000/svg',
	dotRadius = 3,
	collisionRange = 2 * dotRadius,
	updater = null,
	ignoreLastRange = 2;

function Game(display){
	this.display = display;
	
	// initialize keys
	// keydown -> true, keyup -> false
	this.keys = {
		_37: false, _39: false
	}
	document.addEventListener('keyup', function (e){
		switch(e.keyCode){
			case 37:
				e.preventDefault();
				this.keys._37 = false;
				break;
			case 39:
				e.preventDefault();
				this.keys._39 = false;
				break;
		}
	}.bind(this));
	document.addEventListener('keydown', function (e){
		switch(e.keyCode){
			case 37:
				e.preventDefault();
				this.keys._37 = true;
				break;
			case 39:
				e.preventDefault();
				this.keys._39 = true;
				break;
		}
	}.bind(this));
	
	this.player = null;
	this.initialize = function (){
		this.player = (new Player(this, 200, 200)).initialize();
		return this;
	}
	
	this.update = function (delta){
		this.player.update(delta);
	}
}

function Player(game, x, y){
	this.game = game;
	this.display = game.display;
	this.position = game.display.createSVGPoint();
	this.position.x = x; this.position.y = y;
	this.rotation = 0; // in degree, not radian
	this.rotationalSpeed = 360; // degree per second
	this.speed = 75; // pixels per second
	
	this.head = null;
	this.tracks = [];
	this.initialize = function (){
		var dot = document.createElementNS(SVGNS, 'circle');
		dot.setAttribute('r', dotRadius);
		dot.setAttribute('cx', x);
		dot.setAttribute('cy', y);
		dot.setAttribute('fill', '#ff0');
		this.display.appendChild(dot);
		this.tracks.push({dot: dot, x: x, y: y});
		
		this.head = dot;
		return this;
	}
	
	this.update = function (delta){
		var rotationChange = 0;
		if(this.game.keys._37)
			rotationChange -= this.rotationalSpeed * delta;
		if(this.game.keys._39)
			rotationChange += this.rotationalSpeed * delta;
		
		var T = this.display.createSVGMatrix()
				.translate(this.position.x, this.position.y)
				.rotate(this.rotation + rotationChange)
				.translate(0, -this.speed * delta)
				.rotate(-this.rotation)
				.translate(-this.position.x, -this.position.y),
			dot = document.createElementNS(SVGNS, 'circle');
		
		this.rotation += rotationChange;
		this.position = this.position.matrixTransform(T);
		dot.setAttribute('r', dotRadius);
		dot.setAttribute('fill', '#ff0');
		dot.setAttribute('cx', this.position.x);
		dot.setAttribute('cy', this.position.y);
		this.display.appendChild(dot);
		this.tracks.push({dot: dot, x: this.position.x, y: this.position.y});
		
		this.head.setAttribute('fill', '#f00');
		this.head = dot;
		
		if(this.checkCollision()){
			clearInterval(updater);
		}
	}
	
	this.checkCollision = function (){
		for(var i = 0, size = this.tracks.length - ignoreLastRange; i < size; ++i){
			var dx = this.position.x - this.tracks[i].x,
				dy = this.position.y - this.tracks[i].y,
				distance = Math.sqrt(dx * dx + dy * dy);
			
			if(distance < collisionRange){
				return true;
			}
		}
		return false;
	}
}

document.addEventListener('DOMContentLoaded', function (arg){
	var game = (new Game(document.getElementById('display'))).initialize();
	updater = setInterval(game.update.bind(game), msPerFrame, secPerFrame);
});