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

    this.neighbor = function (xDelta, yDelta) {
        return _parent.cell(_x + xDelta, _y + yDelta);  // TODO: needs bind()?
    };

    this.xDistance = function (other) {
        return _parent.xDistance(this.x(), other.x());
    };

    this.yDistance = function (other) {
        return _parent.yDistance(this.y(), other.y());
    };

    this.distanceSqr = function (other)  {
        return Math.pow(this.xDistance(other),2) + Math.pow(this.yDistance(other),2);
    };

    this.distance = function (other)  {
        return Math.sqrt(this.distanceSqr(other));
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
    this.numCells = function () {
        return _xMax * _yMax;
    }

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

    this.row = function (inY) {
        var y = this.yNormalize(inY);
        if (this.yInRange(y)) {
            return _grid[y];
        }
        else {
            return undefined;
        }
    }

    // This can be called either as:
    //   cell(x, y)
    //   cell(rowArray, x)
    this.cell = function (inX, inY) {
        var row;
        if (inX instanceof Array) {
            row = inX;
            inX = inY;
        }
        row = row || this.row(inY);
        if (row) {
            var x = this.xNormalize(inX);
            if (this.xInRange(x)) {
                return row[x];
            }
        }
        return undefined;
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
