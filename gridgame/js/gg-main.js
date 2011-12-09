window.addEventListener("DOMContentLoaded", function() {
    var topo = new Game.Topology.Torus(50,15);
    window.setTimeout(function() {
        var logic = new Game.Logic.Bomb(topo);
    }, 500);
}, false);
