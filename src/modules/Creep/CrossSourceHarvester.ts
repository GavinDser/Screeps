import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";

export const CrossSourceHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep ,source) {
        if(!creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        
        if (creep.memory.working){
            if (creep.room.name == creep.memory.targetRoom){
                var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 10
                });
                if (droppedEnergy.length){
                    if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                        creep.moveTo(droppedEnergy[0]);
                    }
                }
                else{
                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
                
            }
            // if creep is not in the target room
            else{
                let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        
        // finished harvesting
        }
        else{
            if (creep.room.name == creep.memory.homeRoom){
                // var storage = creep.room.find(FIND_STRUCTURES, {
                //     filter: (s) => {
                //         return s.structureType == STRUCTURE_STORAGE &&
                //         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                //     }
                // });
                // if (storage.length){
                //     if(creep.transfer(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                //         creep.moveTo(storage[0], {visualizePathStyle: {stroke: '#ffffff'}});
                //     } 
                // }
                // else{
                    harvester.run(creep);
                //}
                
            }
            
            // if not in home room
            else{
                let exit = creep.room.findExitTo(creep.memory.homeRoom) as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};
