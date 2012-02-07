// http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
//
function getStyle (oElm, strCssRule){
    var strValue = "";
    if(document.defaultView && document.defaultView.getComputedStyle){
	strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
    }
    else if(oElm.currentStyle){
	strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
	    return p1.toUpperCase();
	});
	strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
}

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