// Constructs a new drawing overlay.
function DrawingOverlay(element, offsetTop) {
    this.element = element;
    this.offsetTop = offsetTop;
    this.prevX = null;
    this.prevY = null;

    this.canvas = document.createElement("canvas");
    if (!this.canvas) return;
    
    this.canvas.className = "drawingoverlay";
    this.canvas.id = "drawingoverlay_" + (element.id ? element.id : (int) (Math.random() * 1000000));
    
    // always set it to screen width and height MZ 2014-01-15
    this.canvas.height = screen.height;
    this.canvas.width = screen.width;

    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    
    this.canvas.overlay     = this;
    this.canvas.onmousedown = this.drawMouseDown;
    this.canvas.onmouseup   = this.drawMouseUp;
    this.canvas.onmousemove = this.drawMouseMove;
    this.canvas.clear       = this.clear;
    
    element.appendChild(this.canvas);
}

DrawingOverlay.prototype.clear = function() {
    // updated 2014-01-15 MZ
    // made clear a function of the canvas itself
    // which makes 'this' the canvas
    var g = this.getContext("2d");
    g.clearRect(0, 0, this.width, this.height);
};

DrawingOverlay.prototype.setVisible = function(visible) {
    if (visible) {
        this.canvas.style.display = "block";
    } else {
        this.canvas.style.display = "none";
    }
};

DrawingOverlay.prototype.drawMouseDown = function(event) {
    if (!event) event = window.event;
    if (event.button && event.button > 0) {
        this.overlay.clear();
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        return false;
    }

	if (event.layerX || event.layerX == 0) { // firefox
		this.overlay.prevX = event.layerX;
		this.overlay.prevY = event.layerY;
	} else if (event.offsetX || event.offsetX == 0) { // opera, chrome
		this.overlay.prevX = event.offsetX;
		this.overlay.prevY = event.offsetY;
	}
}

DrawingOverlay.prototype.drawMouseUp = function(event) {
    if (!event) event = window.event;
    this.overlay.prevX = null;
    this.overlay.prevY = null;
};

DrawingOverlay.prototype.drawMouseMove = function(event) {
    if (!event) event = window.event;
    if (this.overlay.prevX === null || this.overlay.prevY === null) return;

    if (!this.getContext) return;

	if (event.layerX || event.layerX == 0) { // firefox
		var x = event.layerX;
		var y = event.layerY;
	} else if (event.offsetX || event.offsetX == 0) { // opera, chrome
		var x = event.offsetX;
		var y = event.offsetY;
	}

	var color = document.getElementById("drawColor").value;
	if (!color) {
		color = "#000000"
	}

    var g = this.getContext("2d");
    g.lineWidth = 3;
    g.fillStyle =   color;
    g.strokeStyle = color;
    
    g.beginPath();
    g.moveTo(this.overlay.prevX, this.overlay.prevY);
    g.lineTo(x, y);
    g.stroke();
    
    // $("dumptarget").innerHTML = prevX + "," + prevY + " -> " + x + "," + y;
    this.overlay.prevX = x;
    this.overlay.prevY = y;
};