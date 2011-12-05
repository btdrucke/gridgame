window.Game = window.Game || {};  // namespace

// ---------------------------------
// Object inheritance util functions
// ---------------------------------

Object.prototype.Inherits = function( inParent )
{
    var parent = Array.prototype.shift.call(arguments);
    --arguments.length;
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
