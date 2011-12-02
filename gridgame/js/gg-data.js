window.Game = window.Game || {};  // namespace

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
