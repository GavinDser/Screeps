import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";

export const CrossHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep ) : void {
        if(!creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        
        if (creep.memory.working){
            if (creep.room.name == creep.memory.targetRoom){
                var findSource = function(){
                    var source = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_EXTENSION && s.store[RESOURCE_ENERGY] > 0
                    }
    
                    });
                    return source[0] as Extract<AnyStructure, StructureExtension | StructureTower |StructureStorage>;;
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
                    creep.memory.working = false;
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
                let exit = creep.room.findExitTo(creep.memory.homeRoom) as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }

        }


        }
};
