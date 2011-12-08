window.addEventListener("DOMContentLoaded", function() {
    var topo = new Game.Topology.Torus(50,15);
    var logic = new Game.Logic.Bomb3d(topo);
}, false);
