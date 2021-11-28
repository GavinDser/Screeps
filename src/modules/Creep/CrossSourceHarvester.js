import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";

export const CrossSourceHarvester = {

    /** @param {Creep} creep **/
    run: function(creep,source) {
        if(!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        if (creep.memory.harvesting){
            if (creep.room.name == creep.memory.target){
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
                let exit = creep.room.findExitTo(creep.memory.target);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        
        // finished harvesting
        }
        else{
            if (creep.room.name == creep.memory.home){
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
                let exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};
