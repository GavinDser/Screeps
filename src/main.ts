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
import { WallRepairer as wallRepairer } from './modules/Creep/WallRepairer'
import { Attacker as attacker } from './modules/Creep/attacker'
import { Claimer as claimer } from './modules/Creep/Claimer'
import { Miner as miner } from './modules/Creep/Miner'
import { TrashHarvester as trashHarvester } from './modules/Creep/TrashHarvester'
import { CenterCreep as centerCreep } from './modules/Creep/CenterCreep'
import { RoomClaimer as roomClaimer } from './modules/Creep/RoomClaimer'
import { crossRoomBuilder as crossRoomBuilder } from './modules/Creep/crossRoomBuilder'
import { crossRoomAttacker as crossRoomAttacker } from './modules/Creep/crossRoomAttacker'


// import "./modules/utils/Talk"
import "./modules/utils/超级移动优化"
import { random } from 'lodash'
import { Body as bodyType } from './modules/utils/Body'
import {RandomName as randomName} from './modules/utils/RandomName'



export const loop = errorMapper(() => {

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
    for (let room in Game.rooms){
        if (room == "E35S47"){
            //spawn creep
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);
            let wallRepairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'wallRepairer' && creep.memory.homeRoom == room);
            let crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester' && creep.memory.homeRoom == room);
            let attackers = _.filter(Game.creeps, (creep) => creep.memory.role == "attacker" && creep.memory.homeRoom == room);
            let claimers = _.filter(Game.creeps, (creep) => creep.memory.role == "claimer" && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            //resource pooint

            //energy count
            var energyMax = Game.spawns['Spawn1'].room.energyCapacityAvailable;
            var energyAvaliable = Game.spawns['Spawn1'].room.energyAvailable;
            var energy1 = Game.getObjectById('5bbcaf169099fc012e63a241') as Source;
            var energy2 = Game.getObjectById('5bbcaf169099fc012e63a240') as Source;
            var mineral= Game.getObjectById('5bbcb634d867df5e54207604') as Mineral;
            var linkList = [Game.getObjectById('61a3f58732b74f02f5a76f1a'),Game.getObjectById('61b63cf5d1bce84e93eb30bd'),Game.getObjectById('61b63440d582576e9ae52683')] as StructureLink[];
            
            // console.log("energyMax: "+energyMax);
            // console.log("Energy Avaliable: "+ energyAvaliable);

            //this.spawnCreep(body,name,{memory: {role: roleName}});
            if(harvesters.length < 1) {
                let energyUsing = undefined;
                if (crossSourceHarvesters.length == 0 && harvesters.length == 0){
                    energyUsing = energyAvaliable;
                }
                else{
                    energyUsing = 1600;
                }
                Game.spawns['Spawn1'].spawnCreep(bodyType.createMoveCarryBody(energyUsing),"Harvester_"+randomName.createName(),
                {memory: {role: "harvester",homeRoom: 'E35S47',linkList:[linkList[0].id,linkList[1].id]}});
            

            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_0")){
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_0",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff5', dontPullMe: true,homeRoom: 'E35S47'}});
            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_1")){
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_1",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff6', dontPullMe: true,homeRoom: 'E35S47'}});
            

            // }else if(centerCreeps.length < 1){
            //     Game.spawns['Spawn1'].spawnCreep([MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"CenterCreep_"+randomName.createName(),
            //     {memory: {role: "centerCreep", dontPullMe: true,homeRoom: 'E35S47'}});        
            }else if(trashHarvesters.length < 1){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"捡垃圾的"+randomName.createName(),
                {memory: {role: "trashHarvester",homeRoom: 'E35S47'}});
            }else if(upgraders.length < 4){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
                {memory: {role: "upgrader",homeRoom: 'E35S47'}});
            }else if(builders.length < 1){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(800),"Builder_"+randomName.createName(),
                {memory:{ role: "builder",homeRoom: 'E35S47'}});
            }else if(claimers.length < 1){
                Game.spawns['Spawn1'].spawnCreep([CLAIM,CLAIM,MOVE,MOVE],"Claimer_"+randomName.createName(),
                {memory: {role: "claimer", homeRoom: 'E35S47', targetRoom:"E36S47"}}); 
            }else if(attackers.length < 1){
                Game.spawns['Spawn1'].spawnCreep([TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE],"Attacker_"+randomName.createName(),
                {memory: {role: "attacker", homeRoom: 'E35S47',targetRoom:"E36S47"}});
            }else if (miners.length < 1 && mineral.mineralAmount > 0){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createAverageBody(1200), "Miner_"+randomName.createName(),
                {memory: {role: "miner",homeRoom: 'E35S47'}});
        
            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_0")){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createPercentageBody(0.4,2500),"CrossSourceHarvester_0",
                {memory: {role: "crossSourceHarvester", homeRoom:'E35S47', targetRoom:'E36S47'}});       
            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_1")){
                Game.spawns['Spawn1'].spawnCreep(bodyType.createPercentageBody(0.4,2500),"CrossSourceHarvester_1",
                {memory: {role: "crossSourceHarvester", homeRoom:'E35S47', targetRoom:'E36S47'}});       
            }
            //tower logic
            
            let towers:StructureTower[] = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
            filter: (t) => t.structureType == STRUCTURE_TOWER
            });

            for (let tower of towers){
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if(closestHostile) {
                tower.attack(closestHostile);
                }
                else{

                    
                    var targets:AnyStructure[] = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => 
                        s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits/s.hitsMax  < 0.8
                        
                    });

                    if(targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                }
                
            }

            //link logic
            if (linkList[2].store.getUsedCapacity(RESOURCE_ENERGY) >= 700){
                if (linkList[1].store.getUsedCapacity(RESOURCE_ENERGY) < 700){
                    linkList[2].transferEnergy(linkList[1])
                }
                else{
                    linkList[2].transferEnergy(linkList[0])
                }
            }

        }  
        else if(room == "E39S47"){
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);  
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester' && creep.memory.homeRoom == room);

            let energyAvaliable = Game.rooms[room].energyAvailable;
            let energyMax = Game.rooms[room].energyCapacityAvailable;
            if (Game.spawns['Spawn2']){
                if(harvesters.length < 1) {
                    let energyUsing = undefined;
                    if (crossSourceHarvesters.length == 0 && harvesters.length == 0){
                        energyUsing = energyAvaliable;
                    }
                    else{
                        energyUsing = 1200;
                    }
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createMoveCarryBody(energyUsing),"Harvester_"+randomName.createName(),
                    {memory: {role: "harvester",homeRoom: 'E39S47',containerId: ""}});
                }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_2")){
                    Game.spawns['Spawn2'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_2",
                    {memory: {role:"harvestCreep", sourceId:'5bbcaf4a9099fc012e63a6ec', dontPullMe: true,homeRoom: 'E39S47'}});

                }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_3")){
                    Game.spawns['Spawn2'].spawnCreep([WORK,WORK,WORK,WORK,WORK,MOVE], "HarvestCreep_3",
                    {memory: {role:"harvestCreep", sourceId:'5bbcaf4a9099fc012e63a6ee', dontPullMe: true,homeRoom: 'E39S47'}});

                }else if(trashHarvesters.length < 1){
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createAverageBody(1200),"捡垃圾的"+randomName.createName(),
                    {memory: {role: "trashHarvester",homeRoom: 'E39S47'}});
                }else if(upgraders.length < 1){
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
                    {memory: {role: "upgrader",homeRoom: 'E39S47'}});                
                
                }else if(builders.length < 1){
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createAverageBody(1200),"Builder_"+randomName.createName(),
                    {memory:{ role: "builder",homeRoom: 'E39S47'}});
                }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_2")){
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_2",
                    {memory: {role: "crossSourceHarvester", homeRoom:'E39S47', targetRoom:'E39S46'}});       
                
                }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_3")){
                    Game.spawns['Spawn2'].spawnCreep(bodyType.createPercentageBody(0.4,energyMax),"CrossSourceHarvester_3",
                    {memory: {role: "crossSourceHarvester", homeRoom:'E39S47', targetRoom:'E39S46'}});     
                } 
                    
            }
            let towers:StructureTower[] = Game.rooms['E39S47'].find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
                });
    
            for (let tower of towers){

                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{
                    filter:(c)=> c.owner.username != "superbitch"
                });
                if(closestHostile) {
                tower.attack(closestHostile);
                }
                else{

                    
                    let targets:AnyStructure[] = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => 
                        s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits/s.hitsMax < 0.8
                        
                    });

                    if(targets.length && tower.store[RESOURCE_ENERGY] > 500) {
                        tower.repair(targets[0]);
                    }
                } 
            }


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
            //特殊处理
            if (creep.name == "CrossSourceHarvester_0"){
                crossSourceHarvester.run(creep,energy1,linkList[2]);
            }
            if (creep.name == "CrossSourceHarvester_1"){
                crossSourceHarvester.run(creep,energy2,linkList[2]);
            }
            if (creep.name == "CrossSourceHarvester_2"){
                crossSourceHarvester.run(creep,Game.getObjectById('5bbcaf4a9099fc012e63a6e9'));
            }
            if (creep.name == "CrossSourceHarvester_3"){
                crossSourceHarvester.run(creep,Game.getObjectById('5bbcaf4a9099fc012e63a6e9'));
            }
            if (creep.memory.role == "attacker"){
                attacker.run(creep,Game.getObjectById("61ad3d7c9a9476cea28addf2"));
            }
            if (creep.memory.role == "claimer"){
                claimer.run(creep);
            }
            if (creep.memory.role == "miner"){
                miner.run(creep);
            }
            if (creep.memory.role == "trashHarvester"){
                trashHarvester.run(creep);
            }
            if (creep.memory.role == "centerCreep"){
                centerCreep.run(creep);
            }
            if (creep.memory.role == "roomClaimer"){
                roomClaimer.run(creep)
            }
            //删
            if (creep.memory.role == "crossRoomBuilder"){
                crossRoomBuilder.run(creep)
            }
            if (creep.memory.role == "crossRoomAttacker"){
                crossRoomAttacker.run(creep);
            }


        }
    //奇怪的东西
    // TalkAll();

    if(Game.cpu.bucket == 10000){
        Game.cpu.generatePixel()
    }
    

});