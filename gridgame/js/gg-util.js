window.Game = window.Game || {};  // namespace

// ---------------------------------
// Object inheritance util functions
// ---------------------------------

Object.prototype.Inherits = function( inParent )
{
    var parent = Array.prototype.shift.call(arguments);
    //--arguments.length;
    parent.apply(this, arguments);
}

// based on http://www.coolpage.com/developer/javascript/Correct%20OOP%20for%20Javascript.html
Function.prototype.Inherits = function( parent )
{
    this.prototype = new parent();
    this.prototype.constructor = this;
}


// -------------------------------
// Game namespace helper functions
// -------------------------------

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

Game.clickCoordsWithinElement = function (event) 
{
    var coords = {x: 0, y: 0};
    if (!event) {
        event = window.event;
        coords.x = event.x;
        coords.y = event.y;
    } else {
        var element = event.target ;
        var totalOffsetLeft = 0;
        var totalOffsetTop = 0 ;

        while (element.offsetParent)
        {
            totalOffsetLeft += element.offsetLeft;
            totalOffsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        coords.x = event.pageX - totalOffsetLeft;
        coords.y = event.pageY - totalOffsetTop;
    }
    return coords;
}

Game.mergeOptions = function (a, b)
{
    var merged = {};
    for (var key in a) {
        if (a.hasOwnProperty(key)) {
            merged[key] = a[key];
        }
    }
    for (var key in b) {
        if (b.hasOwnProperty(key)) {
            merged[key] = b[key];
        }
    }
    return merged;
}