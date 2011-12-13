//var topo = new Game.Topology.Plane();
//var topo = new Game.Topology.Plane({xSize:30, ySize:30, elemSize:20});
//var topo = new Game.Topology.Cylinder();
//var topo = new Game.Topology.Torus({xSize:50, ySize:15});
var topo = new Game.Topology.Torus();
var logic = new Game.Logic.Bomb({topology: topo});
