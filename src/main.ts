import { errorMapper } from './modules/ErrorMapper/errorMapper'

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
import { Carrier as carrier } from './modules/Creep/Carrier'



// import "./modules/utils/Talk"
import "./modules/utils/超级移动优化"
import { Body as bodyType } from './modules/utils/Body'
import {RandomName as randomName} from './modules/utils/RandomName'
import { WhiteListController as whiteListController } from './modules/WhiteList/whiteListController'

import { Stats as stats } from './modules/Stats/Stats'
let whiteListControll;
let whiteList = ['superbitch','orbitingflea']
export const loop = errorMapper(() => {

    //乱改了crossRoomAttacker
    global.whiteList = whiteList;
    (!whiteListControll)?whiteListControll = new whiteListController():whiteListControll.renewAddName();
    whiteListControll.renewAddName();

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
            
            let crossRoomAttackers = _.filter(Game.creeps, (creep) => creep.memory.role == "crossRoomAttacker" && creep.memory.homeRoom == room);
            let roomClaimers = _.filter(Game.creeps, (creep) => creep.memory.role == "roomClaimer" && creep.memory.homeRoom == room);
            let crossRoomBuilders = _.filter(Game.creeps, (creep) => creep.memory.role == "crossRoomBuilder" && creep.memory.homeRoom == room);

            //energy count
            var energyMax = Game.spawns['E35S47_1'].room.energyCapacityAvailable;
            var energyAvaliable = Game.spawns['E35S47_1'].room.energyAvailable;
            let mineral= Game.getObjectById('5bbcb634d867df5e54207604') as Mineral;
            let centerLink =  Game.getObjectById('61a3f58732b74f02f5a76f1a') as StructureLink;
            let outterSourceLink = Game.getObjectById('61b63440d582576e9ae52683') as StructureLink;
            let sourceLink1 = Game.getObjectById('61e9230ca54da5f314382217') as StructureLink;
            let sourceLink2 = Game.getObjectById('61e9247eca3c7ace9b6b3db8') as StructureLink;
            
            // console.log("energyMax: "+energyMax);
            // console.log("Energy Avaliable: "+ energyAvaliable);

            //this.spawnCreep(body,name,{memory: {role: roleName}});
            // if(harvesters.length < 1) {
            //     let energyUsing = undefined;
            //     if (harvesters.length == 0 && trashHarvesters.length == 0){
            //         if (energyAvaliable < 300){
            //             energyUsing = 300
            //         }
            //         else{
            //             energyUsing = energyAvaliable;
            //         }
            //     }
            //     else{
            //         energyUsing = 1600;
            //     }
            //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createMoveCarryBody(energyUsing),"Harvester_"+randomName.createName(),
            //     {memory: {role: "harvester",homeRoom: 'E35S47',linkId: '61a3f58732b74f02f5a76f1a',stateSwitch:false}});
            
            if(trashHarvesters.length < 2){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(2000),"捡垃圾的"+randomName.createName(),
                {memory: {role: "trashHarvester",homeRoom: 'E35S47'}});
            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_0")){
                Game.spawns['E35S47_1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_0",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff5', dontPullMe: true,homeRoom: 'E35S47'}});
            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_1")){
                Game.spawns['E35S47_1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_1",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf069099fc012e639ff6', dontPullMe: true,homeRoom: 'E35S47'}});
            

            }else if(centerCreeps.length < 1){
                Game.spawns['E35S47_1'].spawnCreep([MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"CenterCreep_"+randomName.createName(),
                {memory: {role: "centerCreep", dontPullMe: true,homeRoom: 'E35S47',position:[12,18], working: true}});        
            }else if(upgraders.length < 1 && Game.rooms[room].controller.ticksToDowngrade < 64000){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(300),"Upgrader_"+randomName.createName(),
                {memory: {role: "upgrader",homeRoom: 'E35S47'}});
            }else if(builders.length < 2 && Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(2300),"Builder_"+randomName.createName(),
                {memory:{ role: "builder",homeRoom: 'E35S47'}});
            }else if(claimers.length < 1){
                Game.spawns['E35S47_1'].spawnCreep([CLAIM,CLAIM,MOVE,MOVE],"Claimer_"+randomName.createName(),
                {memory: {role: "claimer", homeRoom: 'E35S47', targetRoom:"E36S47"}}); 
            }else if(attackers.length < 1){
                Game.spawns['E35S47_1'].spawnCreep([TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE],"Attacker_"+randomName.createName(),
                {memory: {role: "attacker", homeRoom: 'E35S47',targetRoom:"E36S47"}});
            }else if (miners.length < 1 && mineral.mineralAmount > 0){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(1200), "Miner_"+randomName.createName(),
                {memory: {role: "miner",homeRoom: 'E35S47',sourceId:'5bbcb634d867df5e54207604'}});


            // }else if(roomClaimers.length < 1){
            //     Game.spawns['E35S47_1'].spawnCreep([ATTACK,CLAIM,MOVE,MOVE,MOVE,MOVE],"RoomClaimer_"+randomName.createName(),
            //     {memory: {role: "roomClaimer", homeRoom: 'E35S47'}});   
            // }else if(crossRoomBuilders.length < 2){
            //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createAverageBody(1600),"CrossRoomBuilder_"+randomName.createName(),
            //     {memory: {role: "crossRoomBuilder", homeRoom: 'E35S47'}});  
            // }else if(crossRoomAttackers.length < 2){
            //     Game.spawns['E35S47_1'].spawnCreep(bodyType.createMoveCarryBody(1600),"CrossRoomAttacker_"+randomName.createName(),
            //     {memory: {role: "crossRoomAttacker", homeRoom: 'E35S47', targetRoom:"E37S48"}});  



            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_0")){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createPercentageBody(0.4,2500),"CrossSourceHarvester_0",
                {memory: {role: "crossSourceHarvester", homeRoom:'E35S47', targetRoom:'E36S47',sourceId:'5bbcaf169099fc012e63a241', linkId: '61b63440d582576e9ae52683'}});       
            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_1")){
                Game.spawns['E35S47_1'].spawnCreep(bodyType.createPercentageBody(0.4,2500),"CrossSourceHarvester_1",
                {memory: {role: "crossSourceHarvester", homeRoom:'E35S47', targetRoom:'E36S47',sourceId:'5bbcaf169099fc012e63a240', linkId: '61b63440d582576e9ae52683'}});     

            }
            //tower logic
            
            let towers:StructureTower[] = Game.spawns['E35S47_1'].room.find(FIND_STRUCTURES, {
            filter: (t) => t.structureType == STRUCTURE_TOWER
            });

            for (let tower of towers){
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter:(c) => whiteList.indexOf(c.owner.username) === -1
                });
                if(closestHostile) {
                tower.attack(closestHostile);
                }
                else{

                    
                    var targets:AnyStructure[] = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => 
                        s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                        
                    });

                    if(targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                }
                
            }

            //link logic
            if (outterSourceLink.store[RESOURCE_ENERGY] > 700){
                outterSourceLink.transferEnergy(centerLink);
            }
            if (sourceLink1.store[RESOURCE_ENERGY] == 800){
                sourceLink1.transferEnergy(centerLink);
            }
            if (sourceLink2.store[RESOURCE_ENERGY] == 800){
                sourceLink2.transferEnergy(centerLink);
            }
            

        }  
        else if(room == "E39S47"){
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);  
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let crossSourceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'crossSourceHarvester' && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            let claimers = _.filter(Game.creeps, (creep) => creep.memory.role == "claimer" && creep.memory.homeRoom == room);
            let attackers = _.filter(Game.creeps, (creep) => creep.memory.role == "attacker" && creep.memory.homeRoom == room);
            let carriers = _.filter(Game.creeps, (creep) => creep.memory.role == "carrier" && creep.memory.homeRoom == room);
            let remoteSourceHarvesters = _.filter(Game.creeps, (creep)=> creep.memory.role == "remoteSourceHarvester" && creep.memory.homeRoom == room)


            let sourceLink1 = Game.getObjectById('61d6dd2832dc6d502a7918ac') as StructureLink;
            let sourceLink2 = Game.getObjectById('61e90b7a22a86677dcbfa8c3') as StructureLink;
            let centerLink = Game.getObjectById('61e4e758883aa8f6df8c1c5d') as StructureLink;
            


            let energyAvaliable = Game.rooms[room].energyAvailable;
            let energyMax = Game.rooms[room].energyCapacityAvailable;
            var mineral= Game.getObjectById('5bbcb65cd867df5e5420778d') as Mineral;

            let builderAmount;
            let builderBody;
            if (Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000){
                builderAmount = 2;
                builderBody = 1600
            }
            else{
                builderAmount = 1;
                builderBody = 1000
            }

            if(trashHarvesters.length < 2) {
                let energyUsing = undefined;
                if (trashHarvesters.length == 0){
                    if (energyAvaliable < 300){
                        energyUsing = 300
                    }
                    else{
                        energyUsing = energyAvaliable;
                    }
                }
                else{
                    energyUsing = 1700;
                }
            Game.spawns['E39S47_2'].spawnCreep(bodyType.createAverageBody(energyUsing),"捡垃圾的"+randomName.createName(),
            {memory: {role: "trashHarvester",homeRoom: 'E39S47'}});
            
            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_2")){
                Game.spawns['E39S47_2'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_2",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf4a9099fc012e63a6ec', dontPullMe: true,homeRoom: 'E39S47'}});

            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_3")){
                Game.spawns['E39S47_2'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_3",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf4a9099fc012e63a6ee', dontPullMe: true,homeRoom: 'E39S47'}});
            
            }else if(centerCreeps.length < 1){
                Game.spawns['E39S47_2'].spawnCreep([MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"CenterCreep_"+randomName.createName(),
                {memory: {role: "centerCreep", dontPullMe: true,homeRoom: 'E39S47',position:[21,15]}});     
            // }else if(upgraders.length < 1){
            //     Game.spawns['E39S47_2'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
            //     {memory: {role: "upgrader",homeRoom: 'E39S47'}});      
            // }else if(carriers.length < 2 && Game.rooms['E39S47'].terminal.store.getUsedCapacity() > 0){
            //     Game.spawns['E39S47_2'].spawnCreep(bodyType.createMoveCarryBody(1400),"Carrier_"+randomName.createName(),
            //     {memory:{ role: "carrier",homeRoom: 'E39S47'}});           
            
            }else if(builders.length < builderAmount){
                Game.spawns['E39S47_1'].spawnCreep(bodyType.createAverageBody(builderBody),"Builder_"+randomName.createName(),
                {memory:{ role: "builder",homeRoom: 'E39S47'}});
            // }else if(claimers.length < 1){
            //     Game.spawns['E39S47_2'].spawnCreep([CLAIM,CLAIM,MOVE,MOVE],"Claimer_"+randomName.createName(),
            //     {memory: {role: "claimer", homeRoom: 'E39S47', targetRoom:"E39S46"}}); 
            }else if(attackers.length < 1){
                Game.spawns['E39S47_2'].spawnCreep([TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE],"Attacker_"+randomName.createName(),
                {memory: {role: "attacker", homeRoom: 'E39S47',targetRoom:"E39S46"}});

            }else if (miners.length < 1 && mineral.mineralAmount > 0){
                Game.spawns['E39S47_2'].spawnCreep(bodyType.createAverageBody(800), "Miner_"+randomName.createName(),
                {memory: {role: "miner",homeRoom: 'E39S47', sourceId:"5bbcb65cd867df5e5420778d"}}); 

            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_2")){
                Game.spawns['E39S47_2'].spawnCreep(bodyType.createPercentageBody(0.4,2400),"CrossSourceHarvester_2",
                {memory: {role: "crossSourceHarvester", homeRoom:'E39S47', targetRoom:'E39S46', sourceId:'5bbcaf4a9099fc012e63a6e9', linkId:'61d6dd2832dc6d502a7918ac'}});    
            
            } 
                    
            
            let towers:StructureTower[] = Game.rooms['E39S47'].find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
                });
    
            for (let tower of towers){

                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{
                    filter:(c) => whiteList.indexOf(c.owner.username) === -1
                });
                if(closestHostile) {
                    tower.attack(closestHostile);
                }
                else{

                    
                    let targets:AnyStructure[] = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => 
                        s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                        
                    });

                    if(targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                } 
            }

            if (sourceLink1.store.getUsedCapacity(RESOURCE_ENERGY) == 800){
                sourceLink1.transferEnergy(centerLink);
            }
            
            if (sourceLink2.store.getUsedCapacity(RESOURCE_ENERGY) == 800){
                sourceLink2.transferEnergy(centerLink);
            }



        }
        else if (room == "E37S48"){
            let energyAvaliable = Game.rooms[room].energyAvailable;
            let energyMax = Game.rooms[room].energyCapacityAvailable;

            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.homeRoom == room);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.homeRoom == room);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.homeRoom == room);  
            let trashHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "trashHarvester" && creep.memory.homeRoom == room);
            let centerCreeps = _.filter(Game.creeps, (creep) => creep.memory.role == "centerCreep" && creep.memory.homeRoom == room);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner" && creep.memory.homeRoom == room);

            let centerLink = Game.getObjectById('61e7d673c32f8f7570ad7e44') as StructureLink;
            let sourceLink1 = Game.getObjectById('61e7dfc0363f39514da6ee51') as StructureLink;
            let sourceLink2 = Game.getObjectById('61ed52620bd2bf7ca5dd404b') as StructureLink;

            var mineral= Game.getObjectById('5bbcb647d867df5e542076b6') as Mineral;

            let trashHarvesterAmount;
            if (Game.rooms[room].storage.store[RESOURCE_ENERGY] > 200000){
                trashHarvesterAmount = 3
            }
            else{
                trashHarvesterAmount = 2;   
            }

            if(trashHarvesters.length < trashHarvesterAmount) {
                let energyUsing = undefined;
                if (trashHarvesters.length == 0){
                    if (energyAvaliable < 300){
                        energyUsing = 300
                    }
                    else{
                        energyUsing = energyAvaliable;
                    }
                }
                else{
                    energyUsing = 1600;
                }
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createMoveCarryBody(energyUsing),"捡垃圾的"+randomName.createName(),
                {memory: {role: "trashHarvester",homeRoom: 'E37S48'}});
            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_4")){
                Game.spawns['E37S48_1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_4",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf269099fc012e63a3dc', dontPullMe: true,homeRoom: 'E37S48'}});

            }else if(!_.some(Game.creeps,(c)=> c.name == "HarvestCreep_5")){
                Game.spawns['E37S48_1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE], "HarvestCreep_5",
                {memory: {role:"harvestCreep", sourceId:'5bbcaf269099fc012e63a3de', dontPullMe: true,homeRoom: 'E37S48'}});

            }else if(centerCreeps.length < 1){
                Game.spawns['E37S48_1'].spawnCreep([MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"CenterCreep_"+randomName.createName(),
                {memory: {role: "centerCreep", dontPullMe: true,homeRoom: 'E37S48',position:[41,36], working: true}});    
            }else if(upgraders.length < 1){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createAverageBody(1200),"Upgrader_"+randomName.createName(),
                {memory: {role: "upgrader",homeRoom: 'E37S48', sourceId:"5bbcaf269099fc012e63a3de"}});                
            }else if(builders.length < 1){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createAverageBody(1200),"Builder_"+randomName.createName(),
                {memory:{ role: "builder",homeRoom: 'E37S48',sourceId:"5bbcaf269099fc012e63a3dc"}});

            }else if (miners.length < 1 && mineral.mineralAmount > 0){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createAverageBody(800), "Miner_"+randomName.createName(),
                {memory: {role: "miner",homeRoom: 'E37S48', sourceId:"5bbcb647d867df5e542076b6"}}); 



            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_3")){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createPercentageBody(0.4,1800),"CrossSourceHarvester_3",
                {memory: {role: "crossSourceHarvester", homeRoom:'E37S48', targetRoom:'E37S49', sourceId:'5bbcaf269099fc012e63a3e0'}}); 
            
            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_4")){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createPercentageBody(0.4,1800),"CrossSourceHarvester_4",
                {memory: {role: "crossSourceHarvester", homeRoom:'E37S48', targetRoom:'E36S48', sourceId:'5bbcaf169099fc012e63a245',linkId:'61ed52620bd2bf7ca5dd404b'}}); 
            }else if (!_.some(Game.creeps,(c)=> c.name == "CrossSourceHarvester_5")){
                Game.spawns['E37S48_1'].spawnCreep(bodyType.createPercentageBody(0.4,1800),"CrossSourceHarvester_5",
                {memory: {role: "crossSourceHarvester", homeRoom:'E37S48', targetRoom:'E37S47', sourceId:'5bbcaf269099fc012e63a3d9',linkId:'61e7dfc0363f39514da6ee51'}}); 
            }




            let towers:StructureTower[] = Game.rooms['E37S48'].find(FIND_STRUCTURES, {
                filter: (t) => t.structureType == STRUCTURE_TOWER
                });
    
            for (let tower of towers){

                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{
                    filter:(c) => whiteList.indexOf(c.owner.username) === -1
                });
                if(closestHostile) {
                    tower.attack(closestHostile);
                }
                else{

                    
                    let targets:AnyStructure[] = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => 
                        s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax
                        
                    });

                    if(targets.length && tower.store[RESOURCE_ENERGY] > 300) {
                        tower.repair(targets[0]);
                    }
                } 
            }

            if (sourceLink1.store.getUsedCapacity(RESOURCE_ENERGY) == 800){
                sourceLink1.transferEnergy(centerLink);
            }
            if (sourceLink2.store.getUsedCapacity(RESOURCE_ENERGY) == 800){
                sourceLink2.transferEnergy(centerLink);
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
            if (creep.memory.role == "crossSourceHarvester"){
                crossSourceHarvester.run(creep);
            }
            if (creep.memory.role == "attacker"){
                attacker.run(creep);
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
            if (creep.memory.role == "carrier"){
                carrier.run(creep);
            }


        }
    //奇怪的东西
    // TalkAll();

    stats();

    if(Game.cpu.bucket == 10000){
        Game.cpu.generatePixel()
    }
    

});