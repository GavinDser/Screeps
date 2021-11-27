import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";

export const CrossHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
            creep.say('harvest!');
        }
        if(creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            creep.say('Store!');
        }
        
        if (creep.memory.harvesting){
            if (creep.room.name == creep.memory.target){
                var findSource = function(){
                    var source = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_EXTENSION && s.store[RESOURCE_ENERGY] > 0
                    }
                    //s.structureType == STRUCTURE_EXTENSION
    
                    });
                    return source[0];
                };

                creep.memory.source = findSource();
                if (creep.memory.source != undefined){

                    if (creep.memory.source.store[RESOURCE_ENERGY] > 0){
                        if (creep.withdraw(creep.memory.source,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.memory.source);
                        }
                    }
                    else{
                        creep.memory.source = findSource();
                    }
                }
                else{
                    creep.memory.harvesting = false;
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
                var storage = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_STORAGE &&
                            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }
                });
                if (storage.length){
                    if(creep.transfer(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    } 
                }
                else{
                    harvester.run(creep);
                }
  
            }
            
            // if not in home room
            else{
                let exit = creep.room.findExitTo(creep.memory.home);
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};
