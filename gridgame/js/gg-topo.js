window.Game = window.Game || {};  // namespace

// -------------------------------------------------
// Game.Topology: Base class for rendering game grids
// -------------------------------------------------

Game.Topology = function (domId, data, elemSize)
{
    console.log("Topology constructor");
    this.xPos = data ? data.xMax() : 0;  // TODO: should be zero, but I'm having trouble with negative degree rotation
    this.yPos = 0;
    this.elemSize = elemSize || 0;
    this.domElem = domId ? document.getElementById(domId) : undefined;

    this.forEach = function (fn) {
        data.forEach( function (cell) {
            fn(cell.elem, cell.x(), cell.y());
        });
    };

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

    var _keyUpMap = {};
    var _keyDownMap = {};

    _keyUpMap

    var that = this;
    function handleKeyDown (event)
    {
        var code = Game.getKeyCode(event);
        switch (code) {
        case 37: //left
            console.log("hit left");
	    that.xSpinBy(1);
	    break;
        case 38: //up
            console.log("hit up");
	    that.ySpinBy(1);
	    break;
        case 39: //right
            console.log("hit right");
	    that.xSpinBy(-1);
	    break;
        case 40: //down
            console.log("hit down");
	    that.ySpinBy(-1);
	    break;
        default:
            return false;
        }
    }

    document.onkeydown = handleKeyDown;

    this.xSpinTo = function (xPos, callWhenDone) {};
    this.ySpinTo = function (yPos, callWhenDone) {};

    this.xSpinBy = function (xDelta, callWhenDone)
    {
        this.xSpinTo(this.xPos + xDelta, callWhenDone);
    }

    this.ySpinBy = function (yDelta, callWhenDone)
    {
        this.ySpinTo(this.yPos + yDelta, callWhenDone);
    }
};


// ----------------------------------------------------------
// Game.Topology.Plane: Renders game grids as a flat rectangle
// ----------------------------------------------------------

Game.Topology.Plane = function (domId, data, elemSize)
{
    this.Inherits(Game.Topology, domId, data, elemSize);

    var topologyHalfWidth  = elemSize*data.xMax()/2;
    var topologyHalfHeight = elemSize*data.yMax()/2;
    var that = this;
    this.forEach(function (elem, x, y) {
        elem.addClassName("cell");
        //elem.innerText = x+","+y;
        elem.style.top  = elemSize*y-topologyHalfHeight + "px";
        elem.style.left = elemSize*x-topologyHalfWidth + "px";
        elem.style.width  = elemSize + "px";
        elem.style.height = elemSize + "px";
        elem.style.lineHeight = elem.style.height;  // To valign
        that.domElem.appendChild(elem);
    });
};


// --------------------------------------------------------
// Game.Topology.Cylinder: Renders game grids as a cylinder.  
//   Wraps around in the X direction.
// --------------------------------------------------------

Game.Topology.Cylinder = function (domId, data, elemSize)
{
    this.Inherits(Game.Topology, domId, data, elemSize);

    data.xInRange   = function (x) {return true;};
    data.xNormalize = function (x) {return Game.normalizeGridIndex(x, data.xMax());}
    data.xDistanace = function (x1, x2) {
        var dist = Math.abs(x1 - x2);
        return (dist < xMax/2) ? dist : Math.abs(dist - xMax);
    }

    var xElemSize = elemSize;
    var yElemSize = elemSize;
    var radius = (xElemSize/2) / Math.tan(Math.PI/data.xMax())
    var xElemRot = 2*Math.PI / data.xMax();
    var topologyHalfWidth  = elemSize*data.xMax()/2;
    var topologyHalfHeight = elemSize*data.yMax()/2;

    var that = this;
    this.forEach(function (elem, x, y) {
        elem.addClassName("cell");
        var xTotalRot = x*xElemRot;
        //elem.innerText = x+","+y;
        elem.style.height = yElemSize + "px";
        elem.style.width  = xElemSize + "px";
        elem.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                      "translateY("+(yElemSize*y - topologyHalfHeight)+"px) " +
                                      "translateZ("+radius+"px)");
        that.domElem.appendChild(elem);
    });

    this.xSpinTo = function (xPos, callWhenDone)
    {
        this.xPos = xPos;
        console.log("torusX: "+xPos);

        this.domElem.style.webkitTransform = (//"translateZ("+(-xOuterRadius)+"px) "+
                                              "rotateY("+(-this.xPos*360/data.xMax())+"deg)");
        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }
    }
};


// --------------------------------------------------
// Game.Topology.Torus: Renders game grids as a torus.  
//   Wraps around in the X and Y directions.
// --------------------------------------------------

Game.Topology.Torus = function (domId, data, elemSize)
{
    console.log("Torus constructor");
    this.Inherits(Game.Topology, domId, data, elemSize);

    data.xInRange   = function (x) {return true;};
    data.xNormalize = function (x) {return Game.normalizeGridIndex(x, data.xMax());}
    data.xDistanace = function (x1, x2) {
        var dist = Math.abs(x1 - x2);
        return (dist < data.xMax()/2) ? dist : Math.abs(dist - data.xMax());
    }

    data.yInRange   = function (y) {return true;};
    data.yNormalize = function (y) {return Game.normalizeGridIndex(y, data.yMax());}
    data.yDistanace = function (y1, y2) {
        var dist = Math.abs(y1 - y2);
        return (dist < data.yMax()/2) ? dist : Math.abs(dist - data.yMax());
    }

    var _slices = new Array(data.xMax());
    this.init = function ()
    {
        var yElemSize = elemSize;
        for (var x = 0; x < data.xMax(); ++x) {
            _slices[x] = document.createElement('div');
            _slices[x].addClassName("slice");
            this.domElem.appendChild(_slices[x]);
            for (var y = 0; y < data.yMax(); ++y) {
                var elem = data.cell(x, y).elem;
                elem.addClassName("cell");
                elem.style.height = yElemSize+"px";
                elem.style.lineHeight = elem.style.height;  // To valign
                _slices[x].appendChild(elem);
            }
        }
    }

    var xOuterRadius;
    this.draw = function ()
    {
        console.log(""+this.xPos+" "+this.yPos)
        var torusRadiusRatio = 0.5;

        var yElemSize = elemSize;
        var yRadius = (yElemSize/2) / Math.tan(Math.PI/data.yMax())
        var yElemRot = 2*Math.PI/data.yMax();

        var xOuterElemSize = elemSize;
        xOuterRadius = (xOuterElemSize/2) / Math.tan(Math.PI/data.xMax())
        var xInnerRadius = xOuterRadius - 2*yRadius;
        var xInnerElemSize = (2 * Math.PI * xInnerRadius) / data.xMax();
        var xMiddleRadius = xOuterRadius - yRadius;
        var xElemRot = 2*Math.PI/data.xMax();

        this.domElem.style.webkitTransform = ("translateZ("+(-xOuterRadius)+"px)");
        for (var x = 0; x < data.xMax(); ++x) {
            var xTotalRot = (x+this.xPos)*xElemRot;
            var slice = _slices[x];
            slice.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                           "translateX("+(-xOuterElemSize/2)+"px) " +
                                           "translateZ("+xMiddleRadius+"px)");
            for (var y = 0; y < data.yMax(); ++y) {
                var yTotalRot = (y+this.yPos)*yElemRot;
                var elem = data.cell(x, y).elem;
                var width = ((xOuterElemSize-xInnerElemSize)/2)*(Math.cos(yTotalRot)+1) + xInnerElemSize;
                elem.innerText = x+","+y;
                elem.style.width = width+"px";
                elem.style.webkitTransform = ("rotateX("+yTotalRot+"rad) " +
                                              "translateX("+(xOuterElemSize-width)/2+"px) " +
                                              "translateZ("+yRadius+"px)");
            }
        }
    }

    this.xSpinTo = function (xPos, callWhenDone)
    {
        this.xPos = xPos;
        console.log("torusX: "+xPos);

        this.domElem.style.webkitTransform = ("translateZ("+(-xOuterRadius)+"px) "+
                                              "rotateY("+(this.xPos*360/data.xMax())+"deg)");
        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }
    }


    this.ySpinTo = function (yPos, callWhenDone)
    {
        this.yPos = yPos;
        console.log("torusY: "+yPos);
        this.draw();        
    }

    this.init();
    this.draw();
};
