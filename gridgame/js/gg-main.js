//var topo = new Game.Topology.Plane();
var topo = new Game.Topology.Plane({xSize:30, ySize:30, elemSize:20});
//var topo = new Game.Topology.Cylinder();
//var topo = new Game.Topology.Cylinder({xSize:20, ySize:5});
//var topo = new Game.Topology.Torus();
//var topo = new Game.Topology.Torus({xSize:50, ySize:15});

//var logic = new Game.Logic.Bomb({topology: topo, bombRatio:0});
var logic = new Game.Logic.Bomb({topology: topo});
