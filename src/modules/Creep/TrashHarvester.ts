import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";
import { Upgrader as upgrader } from "./Upgrader";
export const TrashHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) : void {
        if(!creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        if(creep.room.name == creep.memory.homeRoom){
            //全局使用判定是否过多能量，需要存storage
            var tombEnergy = creep.room.find(FIND_TOMBSTONES, {
                filter: (s) => s.store.getUsedCapacity() > 0
            });
            var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (d) => d.amount >= 0
            });

            var ruinEnergy = creep.room.find(FIND_RUINS, {
                filter: (s) => s.store.getUsedCapacity() > 0
            })
            droppedEnergy = _.sortBy(droppedEnergy, (s) => creep.pos.getRangeTo(s));
            
            if (!creep.memory.working){
                if (creep.store[RESOURCE_ENERGY] != creep.store.getUsedCapacity()){
                    var storage = creep.room.storage;
                    for (const resourceType in creep.store){
                        if (creep.transfer(storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(storage)
                        }
                    }
                }
                else{
                    let harvesterNum = _.filter(Game.creeps, (c) => c.memory.role == 'harvester' && c.memory.homeRoom == creep.room.name).length;
                    let towers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure: StructureTower ) => {
                            return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 700);
                        }
                    });
                    //如果过多energy依然在墓地，则存storage
                    if (tombEnergy.length || droppedEnergy.length || ruinEnergy.length){
                        if (creep.transfer(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.storage)
                        }
                    }
                    else if (harvesterNum < 1){
                        harvester.run(creep)
                    }
                    else if (towers.length){
                        if(creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(towers[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }
                    else{
                        upgrader.run(creep)
                    }
                }

            }
            else{
            
                if (droppedEnergy.length){
                    if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                        creep.moveTo(droppedEnergy[0]);
                    }
                }

                else if(tombEnergy.length){
                    for (const resourceType in tombEnergy[0].store){
                        if (creep.withdraw(tombEnergy[0],resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(tombEnergy[0])
                        }
                    }
                }
                else if(ruinEnergy.length){
                    for (const resourceType in ruinEnergy[0].store){
                        if (creep.withdraw(ruinEnergy[0],resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(ruinEnergy[0])
                        }
                    }
                }
                else{
                    // let sources = creep.room.find(FIND_STRUCTURES, {
                    //     filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                    // })
                    // let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
                    // if (source.length){
                    //     if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    //         creep.moveTo(source[0]);
                    //     }
                    // }
                    upgrader.run(creep);
                }
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.homeRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
};
