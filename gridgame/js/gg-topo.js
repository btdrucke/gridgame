window.Game = window.Game || {};  // namespace

// -------------------------------------------------
// Game.Topology: Base class for rendering game grids
// -------------------------------------------------

Game.Topology = function (xSize, ySize, domId)
{
    console.log("Topology constructor");

    this.xSize = xSize;
    this.ySize = ySize;
    this.data = new Game.Data(this.xSize, this.ySize);

    this.xPos = this.data.xMax();  // TODO: should be zero, but I'm having trouble with negative degree rotation
    this.yPos = 0;
    this.elemSize = 50;
    this.domElem = document.getElementById(domId);

    this.forEach = function (fn) {
        this.data.forEach( function (cell) {
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

    var that = this;
    function handleKeyDown (event)
    {
        var code = Game.getKeyCode(event);
        switch (code) {
        case 37: //left
            console.log("hit left");
	    that.xSpinBy(-1);
            return false;
	    break;
        case 38: //up
            console.log("hit up");
	    that.ySpinBy(1);
            return false;
	    break;
        case 39: //right
            console.log("hit right");
	    that.xSpinBy(1);
            return false;
	    break;
        case 40: //down
            console.log("hit down");
	    that.ySpinBy(-1);
            return false;
	    break;
        default:
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

Game.Topology.Plane = function (xSize, ySize, domId)
{
    var domIdDefault = "grid";
    var xSizeDefault = 10;
    var ySizeDefault = 10;
    this.Inherits(Game.Topology, xSize || xSizeDefault, ySize || ySizeDefault, domId || domIdDefault);

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
        that.domElem.appendChild(elem);
    });
};


// --------------------------------------------------------
// Game.Topology.Cylinder: Renders game grids as a cylinder.  
//   Wraps around in the X direction.
// --------------------------------------------------------

Game.Topology.Cylinder = function (xSize, ySize, domId)
{
    var domIdDefault = "grid";
    var xSizeDefault = 36;
    var ySizeDefault = 10;
    this.Inherits(Game.Topology, xSize || xSizeDefault, ySize || ySizeDefault, domId || domIdDefault)  ;

    this.data.xInRange   = function (x) {return true;};
    this.data.xNormalize = function (x) {return Game.normalizeGridIndex(x, this.data.xMax());}
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
        that.domElem.appendChild(elem);
    });

    this.xSpinTo = function (xPos, callWhenDone)
    {
        this.xPos = xPos;
        console.log("torusX: "+xPos);

        this.domElem.style.webkitTransform = (//"translateZ("+(-xOuterRadius)+"px) "+
                                              "rotateY("+(this.xPos*360/this.data.xMax())+"deg)");
        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }
    }
};


// --------------------------------------------------
// Game.Topology.Torus: Renders game grids as a torus.  
//   Wraps around in the X and Y directions.
// --------------------------------------------------

    Game.Topology.Torus = function (xSize, ySize, domId)
{
    var domIdDefault = "grid";
    var xSizeDefault = 36;
    var ySizeDefault = 10;
    this.Inherits(Game.Topology, xSize || xSizeDefault, ySize || ySizeDefault, domId || domIdDefault);

    this.data.xInRange   = function (x) {return true;};
    this.data.xNormalize = function (x) {return Game.normalizeGridIndex(x, this.xMax());}
    this.data.xDistanace = function (x1, x2) {
        var dist = Math.abs(x1 - x2);
        return (dist < this.xMax()/2) ? dist : Math.abs(dist - this.xMax());
    }

    this.data.yInRange   = function (y) {return true;};
    this.data.yNormalize = function (y) {return Game.normalizeGridIndex(y, this.yMax());}
    this.data.yDistanace = function (y1, y2) {
        var dist = Math.abs(y1 - y2);
        return (dist < this.yMax()/2) ? dist : Math.abs(dist - this.yMax());
    }

    var _slices = new Array(this.data.xMax());
    this.init = function ()
    {
        var stage = document.getElementById("stage");
        stage.classList.add("torus");

        var yElemSize = this.elemSize;
        for (var x = 0; x < this.data.xMax(); ++x) {
            var slice = document.createElement('div');
            _slices[x] = slice;
            slice.classList.add("slice");
            this.domElem.appendChild(_slices[x]);
            for (var y = 0; y < this.data.yMax(); ++y) {
                var elem = this.data.cell(x, y).elem;
                elem.classList.add("cell");
                elem.style.height = yElemSize+"px";
                elem.style.lineHeight = elem.style.height;  // To valign
                slice.appendChild(elem);
            }
        }
    }

    var xOuterRadius;
    this.draw = function ()
    {
        console.log(""+this.xPos+" "+this.yPos)
        var torusRadiusRatio = 0.5;

        var yElemSize = this.elemSize;
        var yRadius = (yElemSize/2) / Math.tan(Math.PI/this.data.yMax())
        var yElemRot = 2*Math.PI/this.data.yMax();

        var xOuterElemSize = this.elemSize;
        xOuterRadius = (xOuterElemSize/2) / Math.tan(Math.PI/this.data.xMax())
        var xInnerRadius = xOuterRadius - 2*yRadius;
        var xInnerElemSize = (2 * Math.PI * xInnerRadius) / this.data.xMax();
        var xMiddleRadius = xOuterRadius - yRadius;
        var xElemRot = 2*Math.PI/this.data.xMax();

        //this.domElem.style.webkitTransform = ("translateZ("+(-xOuterRadius)+"px)");
        this.domElem.style.webkitTransform = ("translateZ("+(200)+"px)");
        for (var x = 0; x < this.data.xMax(); ++x) {
            var xTotalRot = (x+this.xPos)*xElemRot;
            var slice = _slices[x];
            slice.style.webkitTransform = ("rotateY("+xTotalRot+"rad) " +
                                           "translateX("+(-xOuterElemSize/2)+"px) " +
                                           "translateY("+(- yRadius)+"px) " +
                                           "translateZ("+xMiddleRadius+"px)");
            for (var y = 0; y < this.data.yMax(); ++y) {
                var yTotalRot = (y+this.yPos)*yElemRot;
                var elem = this.data.cell(x, y).elem;
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

        this.draw();
        /*
        var xElemRot = 2*Math.PI/this.data.xMax();
        var xTotalRot = (this.xPos) * xElemRot;
        this.domElem.style.webkitTransform = (//"translateZ("+(-xOuterRadius)+"px) "+
                                              "rotateY(" + xTotalRot + "rad)");
        if (callWhenDone && (callWhenDone instanceof Function)) {
	    postAnimationFn = callWhenDone;
        }
        */
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
