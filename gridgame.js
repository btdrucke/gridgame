// ---------------------------------
// Object inheritance util functions
// ---------------------------------

Object.prototype.Inherits = function( inParent )
{
    var parent = Array.prototype.shift.call(arguments);
    parent.apply(this, arguments);
}

// based on http://www.coolpage.com/developer/javascript/Correct%20OOP%20for%20Javascript.html
Function.prototype.Inherits = function( parent )
{
    this.prototype = new parent();
    this.prototype.constructor = this;
}


// --------------------------------
// ClassName manipulation functions
// --------------------------------

HTMLElement.prototype.hasClassName = function (name) 
{
    var re = new RegExp('\\b' + name + '\\b');
    return re.test(this.className);
}

HTMLElement.prototype.addClassName = function (name)
{
    for(var i = 0; i < arguments.length; ++i) {
        var arg = arguments[i];
        if (!this.hasClassName(arg)) {
            this.className += " " + arg;
        }
    }
}

HTMLElement.prototype.removeClassName = function (name)
{
    for(var i = 0; i < arguments.length; ++i) {
        var re = new RegExp('\\b' + arguments[i] + '\\b', 'g');
        this.className = this.className.replace(re, '');
    }
}

// -------------------------------
// Game namespace helper functions
// -------------------------------

window.Game = window.Game || {};  // namespace

Game.normalizeGridIndex = function (w, wMax)
{
    var wTemp = (w % wMax);
    return (wTemp < 0) ? (wTemp+wMax) : wTemp;
}

// based on http://www.selfcontained.us/2009/09/16/getting-keycode-values-in-javascript/
Game.getKeyCode = function (event)
{
    var keycode = null;
    if (window.event) {
        keycode = window.event.keyCode;
    } 
    else if(event) {
        keycode = event.which;
    }
    return keycode;    
}

// ---------------------------------------------------------------
// Game.DataCell, Game.Data: classes for game grids and grid cells
// ---------------------------------------------------------------

Game.DataCell = function (inX, inY, inParent) 
{
    // public 

    this.elem = document.createElement("div");

    this.x = function () {return _x;}
    this.y = function () {return _y;}

    this.neighbor = function(xDelta, yDelta) {
        return _parent.cell(_x + xDelta, _y + yDelta);
    };

    this.xDistance = function(otherCell) {
        return _parent.xDistance(this._x, otherCell._x);
    };

    this.yDistance = function(otherCell) {
        return _parent.yDistance(this._y, otherCell._y);
    };

    // private

    var _parent = inParent;
    var _x = inX;
    var _y = inY;
};


Game.Data = function (inXMax, inYMax) 
{
    // public 

    this.xMax = function () {return _xMax;}
    this.yMax = function () {return _yMax;}

    this.xInRange = function (x) {
        return (x>=0) && (x < _xMax);
    };

    this.yInRange = function (y) {
        return (y>=0) && (y < _yMax);
    };

    this.xNormalize = function (x) {
        return x;
    }

    this.yNormalize = function (y) {
        return y;
    }

    this.xDistance = function (x1, x2) {
        return Math.abs(x1 - x2);
    }
    
    this.yDistance = function (y1, y2) {
        return Math.abs(y1 - y2);
    }

    this.cell = function (inX, inY) {
        var x = this.xNormalize(inX);
        var y = this.yNormalize(inY);
        if (this.xInRange(x) && this.yInRange(y)) {
            return _grid[y][x];
        }
        else {
            return undefined;
        }
    }
  
    this.forEach = function (fn) {
        if (!fn) return;
        _grid.forEach(function (row) {
            row.forEach(function (cell) {
                fn(cell);
            });
        });
    }

    // private

    var _xMax = inXMax;
    var _yMax = inYMax;
    var _grid = [];

    for (var y = 0; y < _yMax; ++y) {
        _grid[y] = [];
        for (var x = 0; x < _xMax; ++x) {
            _grid[y][x] = new Game.DataCell(x, y, this);
        }
    }
};


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


// -------------------------------------
// Game.Logic: Base class for game logic
// -------------------------------------

Game.Logic = function (data, topology)
{
};


// ------------------------------------------
// Game.Logic.Bomb3d : minesweeper game logic
// ------------------------------------------

Game.Logic.Bomb3d = function (inData, topology)
{
    this.Inherits(Game.Logic, inData, topology);

    this.data = inData;
    this.floodStack = [];
    this.showQueue = [];
    this.cellsToShow = 0;
    this.bombsToCreate = 0;
    this.showTimerId;
    this.showTimerDelay = 10;

    // Add Bomb3d-specific state and logic to DataCell
    Game.DataCell.prototype.hasBomb = function () {return (this.bomb3d.state.count > 8);};

    this.reset();
    topology.forEach(function (elem, x, y) {
        //elem.addEventListener("click",     new Function('Game.Logic.Bomb.doFloodFill('+x+', '+y+');'), false);
        //elem.addEventListener("mouseover", new Function('Game.Logic.Bomb.enterCell('+x+', '+y+');'), false);
        //elem.addEventListener("mouseout",  new Function('Game.Logic.Bomb.leaveCell('+x+', '+y+');'), false);
    });
}


Game.Logic.Bomb3d.prototype.reset = function () 
{
    this.data.forEach(function (cell) {
        cell.count = 0;
        cell.shown = false;
        cell.hasFlag = false;
        cell.elem.removeClassName("bomb3d-flagChoice",    // TODO: namespace these class names
                                  "bomb3d-hasFlag",
                                  "bomb3d-hasBomb",
                                  "bomb3d-flagChoice",
                                  "bomb3d-exploded");
        cell.elem.addClassName((cell.x() + cell.y())%2 ? "bomb3d-hiddenEven" : "bomb3d-hiddenOdd");
    });
    
    this.floodStack = [];
    this.showQueue = [];
};


Game.Logic.Bomb3d.prototype.queueShow = function (cell) 
{
    // TODO: hack because duplicates are getting in the list somehow!
    if (cell.shown) return;

    cell.shown = true;
    this.showQueue.push(cell);
    if (!cell.hasBomb()) {
        --this.cellsToShow;
    }
};

Game.Logic.Bomb3d.prototype.showAll = function (startingCell)
{
    this.data.forEach(function (cell) {
        this.queueShow(cell);
    });
    this.doShow(x,y);
};


Game.Logic.Bomb3d.prototype.doShowOnce = function ()
{
    if (!showTimerId) return;

    if (this.showQueue.length) {
        var cell = this.showQueue.pop();
        this.show(cell);
    }
    else {
        window.clearInterval(this.showTimerId);
        this.showTimerId = undefined;
        console.log("cellsToShow", this.cellsToShow);
    }
}

Game.Logic.Bomb3d.prototype.doShow = function (x,y) 
{
    toShowList.sort(function(a,b) {
        var aDistX = Math.abs(a.x-x);
        var bDistX = Math.abs(b.x-x);
        if (do3D && (aDistX > xMax/2)) aDistX = Math.abs(aDistX - xMax);
        if (do3D && (bDistX > xMax/2)) bDistX = Math.abs(bDistX - xMax);
        var aDist = Math.pow(aDistX,2) + Math.pow(Math.abs(a.y-y),2);
        var bDist = Math.pow(bDistX,2) + Math.pow(Math.abs(b.y-y),2);
        if (aDist == bDist) return 0;
        else if (aDist < bDist) return 1;
        else return -1;
    });

    [x, y] = toShowList.pop();
    show(x, y);
    this.showTimerId = window.setInterval("doShowOnce()", this.showTimerDelay);
}

// ------------------
// Script entry point
// ------------------

window.onload = function() 
{
    var data = new Game.Data(36, 10);
    var topo = new Game.Topology.Torus("grid", data, 50);
    var logic = new Game.Logic.Bomb3d(data, topo);
};
