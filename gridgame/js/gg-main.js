//var topo = new Game.Topology.Plane();
//var topo = new Game.Topology.Plane({xSize:4, ySize:7, elemSize:50});
//var topo = new Game.Topology.Cylinder({xSize:20, ySize:5});
//var topo = new Game.Topology.Torus({xSize:20, ySize:8});
var topo = new Game.Topology.Torus();
//var logic = new Game.Logic.Bomb({topology: topo, bombRatio:0});
var logic = new Game.Logic.Bomb({topology: topo});
