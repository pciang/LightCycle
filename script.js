var secPerFrame = 1 / 24,
	secPerUpdate = secPerFrame,
	msPerFrame = 1000 / 24,
	msPerUpdate = 1000 / 24,
	SVGNS = 'http://www.w3.org/2000/svg',
	dotRadius = 3,
	collisionRange = 2 * dotRadius,
	updater = null,
	ignoreLastRange = 2,
	dotSpeed = 75,
	dotRotationalSpeed = 360;

function Game(display){
	this.display = display;
	this.display_w = 320;
	this.display_h = 240;
	
	// initialize keys
	// keydown -> true, keyup -> false
	this.keys = {
		_37: false, _39: false, _65: false, _68: false
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
			case 65:
				e.preventDefault();
				this.keys._65 = false;
				break;
			case 68:
				e.preventDefault();
				this.keys._68 = false;
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
			case 65:
				e.preventDefault();
				this.keys._65 = true;
				break;
			case 68:
				e.preventDefault();
				this.keys._68 = true;
				break;
		}
	}.bind(this));
	
	this.playerOne = null;
	this.playerTwo = null;
	this.initialize = function (){
		this.playerOne = (new Player(this, 100, 120, '#f00', ['_37', '_39'])).initialize();
		this.playerTwo = (new Player(this, 260, 120, '#00f', ['_65', '_68'])).initialize();
		return this;
	}
	
	this.update = function (delta){
		this.playerOne.update(delta);
		this.playerTwo.update(delta);
		
		if(!this.playerOne.isAlive && !this.playerTwo.isAlive){
			alert('Both players are drunk! :P');
		} else if(!this.playerOne.isAlive){
			alert('Player one is high! XD');
		} else if(!this.playerTwo.isAlive){
			alert('Player two is high! XD');
		}
	}
}

function Player(game, x, y, color, keys){
	this.isAlive = true;
	this.game = game;
	this.display = game.display;
	
	// clear SVG for new game
	(function (){
		var child;
		while(child = display.firstChild){
			display.removeChild(child);
		}
	})();
	
	this.position = game.display.createSVGPoint();
	this.position.x = x; this.position.y = y;
	this.rotation = 0; // in degree, not radian
	this.rotationalSpeed = dotRotationalSpeed; // degree per second
	this.speed = dotSpeed; // pixels per second
	
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
		if(this.game.keys[keys[0]])
			rotationChange -= this.rotationalSpeed * delta;
		if(this.game.keys[keys[1]])
			rotationChange += this.rotationalSpeed * delta;
		
		var T = this.display.createSVGMatrix()
				.translate(this.position.x, this.position.y)
				.rotate(this.rotation + rotationChange)
				.translate(0, -this.speed * delta)
				.rotate(-this.rotation)
				.translate(-this.position.x, -this.position.y),
			dot = document.createElementNS(SVGNS, 'circle');
		
		this.rotation += rotationChange;
		if(this.rotation > 180)
			this.rotation -= 360;
		if(this.rotation < -180)
			this.rotation += 360;
		
		this.position = this.position.matrixTransform(T);
		dot.setAttribute('r', dotRadius);
		dot.setAttribute('fill', '#ff0');
		dot.setAttribute('cx', this.position.x);
		dot.setAttribute('cy', this.position.y);
		this.display.appendChild(dot);
		this.tracks.push({dot: dot, x: this.position.x, y: this.position.y});
		
		this.head.setAttribute('fill', color);
		this.head = dot;
		
		if(this.checkCollision()){
			clearInterval(updater);
			updater = null;
			this.isAlive = false;
		}
	}
	
	this.checkCollision = function (){
		if(this.position.x < dotRadius
			|| this.position.y < dotRadius
			|| this.game.display_w - this.position.x < dotRadius
			|| this.game.display_h - this.position.y < dotRadius){
			return true;
		}
		
		for(var i = 0, size = this.tracks.length - ignoreLastRange; i < size; ++i){
			var dx = this.position.x - this.tracks[i].x,
				dy = this.position.y - this.tracks[i].y,
				distance = Math.sqrt(dx * dx + dy * dy);
			
			if(distance < collisionRange){
				return true;
			}
		}
		
		var other = this.game.playerOne == this ? this.game.playerTwo : this.game.playerOne;
		for(var i = 0, size = other.tracks.length; i < size; ++i){
			var dx = this.position.x - other.tracks[i].x,
				dy = this.position.y - other.tracks[i].y,
				distance = Math.sqrt(dx * dx + dy * dy);
			
			if(distance < collisionRange){
				return true;
			}
		}
		
		return false;
	}
}



document.addEventListener('DOMContentLoaded', function (arg){
	document.addEventListener('keydown', function (e){
		if(e.keyCode == 32 && updater == null){
			var game = (new Game(document.getElementById('display'))).initialize();
			updater = setInterval(game.update.bind(game), msPerFrame, secPerFrame);
		}
	});
});