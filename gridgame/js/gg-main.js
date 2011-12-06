window.onload = function() 
{
    var topo = new Game.Topology.Torus();
    var logic = new Game.Logic.Bomb3d(topo.data, topo);
};
