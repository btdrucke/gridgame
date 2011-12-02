window.onload = function() 
{
    var data = new Game.Data(36, 10);
    var topo = new Game.Topology.Torus("grid", data, 50);
    var logic = new Game.Logic.Bomb3d(data, topo);
};
