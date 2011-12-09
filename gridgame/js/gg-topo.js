window.Game = window.Game || {};  // namespace

// -------------------------------------------------
// Game.Topology: Base class for rendering game grids
// -------------------------------------------------

Game.Topology = function (xSize, ySize, domId)
{
    console.log("Topology constructor");

    domId = domId || "grid";
    var _domElem;
    this.domElem = function () {
        return _domElem = _domElem || document.getElementById(domId);
    }

    this.xSize = xSize;
    this.ySize = ySize;
    this.data = new Game.Data(this.xSize, this.ySize);

    this.xPos = 0;
    this.yPos = 0;
    this.elemSize = 50;

    this.forEach = function (fn) {
        this.data.forEach( function (cell) {
            fn(cell.elem, cell.x(), cell.y());
        });
    };

    var _msgElem;
    this.setMessage = function (msg)
    {
        _msgElem = _msgElem || document.getElementById('message');
        _msgElem.innerText = msg;
    }

    this.registerKey = function (keyCode, downHandler, upHandler) {
        if (downHandler && upHandler) {
            _keyDownMap[keyCode] = downHandler;
            _keyDownMap[keyCode] = upHandler;
        }
        else if (downHandler) {
            _keyDownMap[keyCode] = downHandler;
            delete _keyUpMap[keyCode];
        }
        else {
            delete _keydownMap[keyCode];
            delete _keyUpMap[keyCode];
        }
    }


    this.xSpinTo = function (xPos, callWhenDone) {        
        console.log("Game.Topology.xSpinTo:", xPos);
        return this;
    };

    this.ySpinTo = function (yPos, callWhenDone) {
        console.log("Game.Topology.ySpinTo:", yPos);
        return this;
    };

    this.spinTo = function (xPos, yPos, callWhenDone)
    {
        console.log("Game.Topology.spinTo:", xPos, yPos);
        return this.xSpinTo(xPos).ySpinTo(yPos, callWhenDone);
    }

    this.xSpinBy = function (xDelta, callWhenDone)
    {
        return this.xSpinTo(this.xPos + xDelta, callWhenDone);
    }

    this.ySpinBy = function (yDelta, callWhenDone)
    {
        return this.ySpinTo(this.yPos + yDelta, callWhenDone);
    }


    var _keyUpMap = {};
    var _keyDownMap = {};

    function _handleKeyDown (event)
    {
        var code = Game.getKeyCode(event);
        switch (code) {
        case 37: //left
            console.log("hit left");
	    this.xSpinBy(1);
            return false;
	    break;
        case 38: //up
            console.log("hit up");
	    this.ySpinBy(1);
            return false;
	    break;
        case 39: //right
            console.log("hit right");
	    this.xSpinBy(-1);
            return false;
	    break;
        case 40: //down
            console.log("hit down");
	    this.ySpinBy(-1);
            return false;
	    break;
        default:
        }
    }

    var _pressed = false;
    var _xDragging = false, _yDragging = false;
    var _firstX = 0, _lastX = 0, _lastXDelta = 0, _totalXDelta = 0, _firstXPos = 0;
    var _firstY = 0, _lastY = 0, _lastYDelta = 0, _totalYDelta = 0, _firstYPos = 0;
    var _lastTime;

    function _mouseDown (event) 
    {
        if (!_pressed) {
	    var coords = Game.clickCoordsWithinElement(event);
	    _firstXPos = this.xPos;
	    _firstX = _lastX = coords.x;

	    _firstYPos = this.yPos;
	    _firstY = _lastY = coords.y

	    _lastTime = new Date();
	    _pressed = true;
	    _xDragging = _yDragging = false;
        }
    }


    function _mouseUp (event) 
    {
        if (_pressed) {
            _pressed = false;
	    if (_xDragging) {
	        if (Math.abs(_lastXRate) > 0.05) {
                    var data = this.topology.data;
		    console.log("flick X:" + _lastXRate);
		    //var xSpinBy = -Math.max(data.xMax()-1, _lastXRate * 20);
		    var xSpinBy = -(_lastXRate * 20);
		    this.xSpinTo(this.xPos + xSpinBy);
	        }
	        _xDragging = false;
            }
	    if (_yDragging) {
	        if (Math.abs(_lastYRate) > 0.05) {
                    var data = this.topology.data;
		    console.log("flick Y:" + _lastYRate);
		    var ySpinBy = Math.max(data.yMax()/2, _lastYRate * 2);
		    this.ySpinTo(this.yPos + ySpinBy);
	        }
	        _yDragging = false;
	    }
	    else {
	    }
        }
    }


    function _mouseMove (event) 
    {
        if (_pressed) {
	    var coords = Game.clickCoordsWithinElement(event);
	    var thisTime = new Date();
	    var timeDelta = thisTime - _lastTime;

            var xDelta = coords.x - _lastX;
	    var totalXDelta = coords.x - _firstX;
	    if (Math.abs(totalXDelta) > 4) {
	        var xSpinBy = -totalXDelta / 30;
	        this.xSpinTo(_firstXPos - xSpinBy);
	    }
	    // fuzzy factor to determine drag versus sloppy click
            if (Math.abs(xDelta) > 4) {  
                _xDragging = true;
	        _lastXRate = xDelta/timeDelta;
	        console.log("dragging: " + _lastX, coords.x, xDelta, _lastTime, _lastXRate);
                _lastX = coords.x;
            }

            var yDelta = coords.y - _lastY;
	    var totalYDelta = coords.y - _firstY;
	    if (Math.abs(totalYDelta) > 4) {
	        var ySpinBy = totalYDelta / 30;
	        this.ySpinTo(_firstYPos - ySpinBy);
	    }
	    // fuzzy factor to determine drag versus sloppy click
            if (Math.abs(yDelta) > 4) {  
                _yDragging = true;
	        _lastYRate = yDelta/timeDelta;
	        console.log("dragging Y: " + _lastY, coords.y, yDelta, _lastTime, _lastXRate);
                _lastY = coords.y;
            }
        }
    }

    // -----------
    // constructor

    document.onkeydown = _handleKeyDown.bind(this);
    document.addEventListener('mousedown', _mouseDown.bind(this), false);
    document.addEventListener('mousemove', _mouseMove.bind(this), false);
    document.addEventListener('mouseup',   _mouseUp.bind(this),   false);
};


// ----------------------------------------------------------
// Game.Topology.Plane: Renders game grids as a flat rectangle
// ----------------------------------------------------------

Game.Topology.Plane = function (xSize, ySize, domId)
{
    xSize = xSize || 10;
    ySize = ySize || 10;
    this.Inherits(Game.Topology, xSize, ySize, domId);

    var topologyHalfWidth  = this.elemSize*this.data.xMax()/2;
    var topologyHalfHeight = this.elemSize*this.data.yMax()/2;
    var that = this;
    this.forEach(function (elem, x, y) {
        elem.classList.add("cell");
        //elem.innerText = x+","+y;
        elem.style.top  = that.elemSize*y-topologyHalfHeight + "px";
        elem.style.left = that.elemSize*x-topologyHalfWidth + "px";
        elem.style.width  = that.elemSize + "px";
        elem.style.height = that.elemSize + "px";
        elem.style.lineHeight = elem.style.height;  // To valign
        that.domElem().appendChild(elem);
    });
};


// --------------------------------------------------------
// Game.Topology.Cylinder: Renders game grids as a cylinder.  
//   Wraps around in the X direction.
// --------------------------------------------------------

Game.Topology.Cylinder = function (xSize, ySize, domId)
{
    xSize = xSize || 36;
    ySize = ySize || 10;
    this.Inherits(Game.Topology, xSize, ySize, domId);

    this.data.xInRange   = function (x) {return true;};
    this.data.xNormalize = function (x) {return Game.normalizeGridIndex(x, this.xMax());}
    this.data.xDistanace = function (x1, x2) {
        var dist = Math.abs(x1 - x2);
        return (dist < xMax/2) ? dist : Math.abs(dist - xMax);
    }

    var xElemSize = this.elemSize;
    var yElemSize = this.elemSize;
    var radius = (xElemSize/2) / Math.tan(Math.PI/this.data.xMax())
    var xElemRot = 2*Math.PI / this.data.xMax();
    var topologyHalfWidth  = this.elemSize*this.data.xMax()/2;
    var topologyHalfHeight = this.elemSize*this.data.yMax()/2;

    var that = this;
    this.forEach(function (elem, x, y) {
        elem.classList.add("cell");
        var xTotalRot = x*xElemRot;
        //elem.innerText = x+","+y;
        elem.style.height = yElemSize + "px";
        elem.style.width  = xElemSize + "px";
        elem.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                      "translateY("+(yElemSize*y - topologyHalfHeight)+"px) " +
                                      "translateZ("+radius+"px)");
        that.domElem().appendChild(elem);
    });

    this.xSpinTo = function (xPos, callWhenDone)
    {
        this.xPos = xPos;
        this.domElem().style.webkitTransform = ("rotateY("+(this.xPos*360/this.data.xMax())+"deg)");
        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }
        return this;
    }
};


// --------------------------------------------------
// Game.Topology.Torus: Renders game grids as a torus.  
//   Wraps around in the X and Y directions.
// --------------------------------------------------

Game.Topology.Torus = function (xSize, ySize, domId)
{
    xSize = xSize || 36;
    ySize = ySize || 10;
    this.Inherits(Game.Topology, xSize, ySize, domId);
    
    var _xMax = this.data.xMax();
    var _yMax = this.data.yMax();

    this.data.xInRange   = function (x) {return true;};
    this.data.xNormalize = function (x) {return Game.normalizeGridIndex(x, _xMax);}
    this.data.xDistance = function (x1, x2) {
        var dist = Math.abs(x1 - x2);
        return (dist < this.xMax()/2) ? dist : Math.abs(dist - this.xMax());
    }

    this.data.yInRange   = function (y) {return true;};
    this.data.yNormalize = function (y) {return Game.normalizeGridIndex(y, _yMax);}
    this.data.yDistance = function (y1, y2) {
        var dist = Math.abs(y1 - y2);
        return (dist < _yMax/2) ? dist : Math.abs(dist - _yMax);
    }

    var _slices = new Array(_xMax);
    var _stageElem;
    function _init ()
    {
        this.domElem().style.webkitTransform = ("translateZ("+(200)+"px)");
        var _stageElem = _stageElem || document.getElementById("stage");
        _stageElem.classList.add("torus");

        var yElemSize = this.elemSize;
        for (var x = 0; x < _xMax; ++x) {
            var slice = document.createElement('div');
            _slices[x] = slice;
            slice.classList.add("slice");
            for (var y = 0; y < _yMax; ++y) {
                var elem = this.data.cell(x, y).elem;
                elem.classList.add("cell");
                elem.style.height = yElemSize+"px";
                elem.style.lineHeight = elem.style.height;  // To valign
                elem.innerText = x+","+y;
                slice.appendChild(elem);
            }
            this.domElem().appendChild(_slices[x]);
        }
    }

    var _yElemSize = this.elemSize;
    var _yRadius = (_yElemSize/2) / Math.tan(Math.PI/_yMax);
    var _yElemRot = -2*Math.PI/_yMax;
    var _xOuterElemSize = this.elemSize;
    var _xOuterRadius = (_xOuterElemSize/2) / Math.tan(Math.PI/_xMax);
    var _xInnerRadius = _xOuterRadius - (2 * _yRadius);
    var _xInnerElemSize = (2 * Math.PI * _xInnerRadius) / _xMax;
    var _xMiddleRadius = _xOuterRadius - _yRadius;
    var _xElemRot = 2*Math.PI/_xMax;

    function _draw ()
    {
        console.log("_draw:"+this.xPos+" "+this.yPos)

        for (var x = 0; x < _xMax; ++x) {
            var xTotalRot = (x-this.xPos) * _xElemRot;
            var slice = _slices[x];
            slice.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                           "translateX(" + (- _xOuterElemSize/2) + "px) " +
                                           "translateY(" + (- _yRadius) + "px) " +
                                           "translateZ(" + _xMiddleRadius + "px)");
            for (var y = 0; y < _yMax; ++y) {
                var yTotalRot = (y-this.yPos) * _yElemRot;
                var elem = this.data.cell(x, y).elem;
                var width = ((_xOuterElemSize-_xInnerElemSize)/2)*(Math.cos(yTotalRot)+1) + _xInnerElemSize;
                elem.style.width = width+"px";
                elem.style.webkitTransform = ("rotateX(" + yTotalRot + "rad) " +
                                              "translateX(" + (_xOuterElemSize-width)/2 + "px) " +
                                              "translateZ(" + _yRadius + "px)");
            }
        }
    }

    this.xSpinTo = function (xPos, callWhenDone)
    {
        console.log("Game.Topology.Torus.xSpinTo:", xPos);
        this.xPos = xPos;
        _draw.bind(this)();

        /*
        var xDeltaRot = (xPos - this.xPos) * _xElemRot;
        this.xPos = xPos;
        this.domElem().style.webkitTransform = ("translateZ(200px) "+
                                                "rotateY(" + xDeltaRot + "rad)");
        */

        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }

        return this;
    }


    this.ySpinTo = function (yPos, callWhenDone)
    {
        console.log("Game.Topology.Torus.ySpinTo:", yPos);
        this.yPos = yPos;
        _draw.bind(this)();

        return this;
    }
    
    _init.bind(this)();
    _draw.bind(this)();
};
