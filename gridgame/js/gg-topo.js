window.Game = window.Game || {};  // namespace

// -------------------------------------------------
// Game.Topology: Base class for rendering game grids
// -------------------------------------------------

Game.Topology = function (domId, data, elemSize)
{
    this.xPos = data.xMax();  // TODO: should be zero, but I'm having trouble with negative degree rotation
    this.yPos = 0;
    this.elemSize = elemSize;
    this.domElem = document.getElementById(domId);

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
	    that.xSpinBy(-1);
	    break;
        case 38: //up
	    that.ySpinBy(-1);
	    break;
        case 39: //right
	    that.xSpinBy(1);
	    break;
        case 40: //down
	    that.ySpinBy(1);
	    break;
            return false;
        }
    }
    document.onkeydown = handleKeyDown;
};

Game.Topology.prototype.xSpinTo = function (xPos, callWhenDone)
{
    console.log("xSpinto:", xPos);
}

Game.Topology.prototype.ySpinTo = function (yPos, callWhenDone)
{
    console.log("ySpinto:", xPos);
}

Game.Topology.prototype.xSpinBy = function (xDelta, callWhenDone)
{
    this.xSpinTo(this.xPos + xDelta, callWhenDone);
}

Game.Topology.prototype.ySpinBy = function (yDelta, callWhenDone)
{
    this.xSpinTo(this.xPos + xDelta, callWhenDone);
}


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

    this.domElem.style.webkitTransform = ("translateZ("+(-xOuterRadius)+"px)");
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
};


// --------------------------------------------------
// Game.Topology.Torus: Renders game grids as a torus.  
//   Wraps around in the X and Y directions.
// --------------------------------------------------

Game.Topology.Torus = function (domId, data, elemSize)
{
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

    var torusRadiusRatio = 0.5;

    var yElemSize = elemSize;
    var yRadius = (yElemSize/2) / Math.tan(Math.PI/data.yMax())
    var yElemRot = 2*Math.PI/data.yMax();

    var xOuterElemSize = elemSize;
    var xOuterRadius = (xOuterElemSize/2) / Math.tan(Math.PI/data.xMax())
    var xInnerRadius = xOuterRadius - 2*yRadius;
    var xInnerElemSize = (2 * Math.PI * xInnerRadius) / data.xMax();
    var xMiddleRadius = xOuterRadius - yRadius;
    var xElemRot = 2*Math.PI/data.xMax();

    this.domElem.style.webkitTransform = ("translateZ("+(-xOuterRadius)+"px)");
    for (var x = 0; x < data.xMax(); ++x) {
        var xTotalRot = x*xElemRot;
        var slice = document.createElement('div');
        slice.addClassName("slice");
        slice.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                       "translateX("+(-xOuterElemSize/2)+"px) " +
                                       "translateZ("+xMiddleRadius+"px)");
        this.domElem.appendChild(slice);
        for (var y = 0; y < data.yMax(); ++y) {
            var yTotalRot = y*yElemRot;
            var elem = data.cell(x, y).elem;
            var width = ((xOuterElemSize-xInnerElemSize)/2)*(Math.cos(yTotalRot)+1) + xInnerElemSize;
            elem.addClassName("cell");
            elem.innerText = x+","+y;
            elem.style.height = yElemSize+"px";
            elem.style.width = width+"px";
            elem.style.lineHeight = elem.style.height;  // To valign
            elem.style.webkitTransform = ("rotateX("+yTotalRot+"rad) " +
                                          "translateX("+(xOuterElemSize-width)/2+"px) " +
                                          "translateZ("+yRadius+"px)");
            slice.appendChild(elem);
        }
    }
};
