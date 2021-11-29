// To be efficient, you have to mine 3000 energy every 300 ticks.
// If it's empty before that, you have lost energy on useless creeps.
// If it's not empty after 300 ticks, you have lost the energy that was left.

// A miner with 5 work parts will mine exactly 3000 energy every 300 ticks.
// So only one miner per source.
// You can store energy on the same tick as you harvest, so it never stops.
// You need a container/storage/link next to the miner.

// I personally save sourceId in my miner memory when it spawns.




import { errorMapper } from './modules/errorMapper'

import { Harvester as harvester } from './modules/Creep/Harvester'
import { HarvestCreep as harvestCreep } from './modules/Creep/HarvestCreep'
import { Upgrader as upgrader } from './modules/creep/Upgrader'
import { Builder as builder } from './modules/creep/Builder'
import { Repairer as repairer } from './modules/creep/Repairer'
import { CrossHarvester as crossHarvester } from './modules/Creep/CrossHarvester'
import { CrossSourceHarvester as crossSourceHarvester } from './modules/Creep/CrossSourceHarvester'
import { WallRepairer as wallRepairer } from './modules/creep/WallRepairer'


import "./modules/utils/Talk"
import { RandomName as randomName } from './modules/RandomName/RandomName'
import { random } from 'lodash'
import { Body as bodyType } from './modules/utils/Body'


export const loop = errorMapper(() => {

    //prototyping for spawn
    // clearing memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            // if (Memory.creeps[name].role == "crossSourceHarvester"){
            //     energyArr.push(Memory.creeps[name].sourceIndex);
            // }
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    //spawn creep
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var harvestCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvestCreep');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    var repairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer');
    var wallRepairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'wallRepairer');
    var crossHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossHarvester');
    var crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester');

    //resource pooint

    //energy count
    var energyMax = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    var energyAvaliable = Game.spawns['Spawn1'].room.energyAvailable;
    var energy1 = Game.getObjectById('5bbcaf169099fc012e63a241');
    var energy2 = Game.getObjectById('5bbcaf169099fc012e63a240');
    // console.log("energyMax: "+energyMax);
    // console.log("Energy Avaliable: "+ energyAvaliable);

    //this.spawnCreep(body,name,{memory: {role: roleName}});

    if(harvesters.length < 1) {
        let energyUsing = undefined;
        if (crossSourceHarvesters.length == 0 && harvesters.length == 0){
            energyUsing = energyAvaliable;
        }
        else{
            energyUsing = 1300;
        }
        Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(energyUsing),"Harvester_"+randomName.createName(),
        {memory: {role: "harvester"}});
    

    }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_0")){
        Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_0",
        {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff5'}});
    }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_1")){
        Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_1",
        {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff6'}});
    
    
    }else if(upgraders.length < 1){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
        {memory: {role: "upgrader"}});
    }else if(repairers.length < 1){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"Repairer_"+randomName.createName(),
        {memory: {role: "repairer"}});
    }else if(builders.length < 1){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"Builder_"+randomName.createName(),
        {memory:{ role: "builder", target: 0}});
    }else if(wallRepairers.length < 1){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"WallRepairer_"+randomName.createName(),
        {memory: {role: "wallRepairer", target: ""}})
    
    // }else if(crossHarvesters.length < 1) {
    //     Game.spawns['Spawn1'].spawnCreep(bodyType.createSoloBody('carry',1200),"CrossHarvester_"+randomName.createName(),
    //     {memory: {role:"crossHarvester", home:"E35S47", target:"E36S47"}});
    }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_0")){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_0",
        {memory: {role: "crossSourceHarvester", home:'E35S47', target:'E36S47'}});       
    }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_1")){
        Game.spawns['Spawn1'].spawnCreep(bodyType.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_1",
        {memory: {role: "crossSourceHarvester", home:'E35S47', target:'E36S47'}});       
    }
    //tower logic

    var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
      filter: (t) => t.structureType == STRUCTURE_TOWER
    });

    for (let tower of towers){
    //   var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    //       filter: (structure) => structure.hits < structure.hitsMax
    //   });
    //   if(closestDamagedStructure) {
    //       tower.repair(closestDamagedStructure);
    //   }

      var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if(closestHostile) {
          tower.attack(closestHostile);
      }
    }


    //creep running
    for (name in Game.creeps){
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester'){
            harvester.run(creep);
        }
        if (creep.memory.role == "harvestCreep"){
            harvestCreep.run(creep);
        }
        if (creep.memory.role == "upgrader"){
            upgrader.run(creep);
        }
        if (creep.memory.role == "builder"){
            builder.run(creep);
        }
        if (creep.memory.role == "repairer"){
            repairer.run(creep);
        }
        if (creep.memory.role == "wallRepairer"){
            wallRepairer.run(creep);
        }
        if (creep.memory.role == "crossSourceHarvester"){
            crossSourceHarvester.run(creep);
        }
        if (creep.memory.role == "crossHarvester"){
            crossHarvester.run(creep);
        }
        //特殊处理
        if (creep.name == "CrossSourceHarvester_0"){
            crossSourceHarvester.run(creep,energy1);
        }
        if (creep.name == "CrossSourceHarvester_1"){
            crossSourceHarvester.run(creep,energy2);
        }



    }

    //奇怪的东西
    TalkAll();

    if(Game.cpu.bucket == 10000){
        Game.cpu.generatePixel()
    }


}) 