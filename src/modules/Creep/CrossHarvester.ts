import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";
import { Path as path } from "../utils/Path";

export const CrossHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep ) : void {
        if(!creep.memory.working && creep.store.getFreeCapacity() == creep.store.getUsedCapacity()) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        
        if (creep.memory.working){
            if (creep.room.name == creep.memory.targetRoom){
                let storage = creep.room.storage
                for (const resourceType in storage){
                    if(creep.withdraw(storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                        creep.moveTo(storage);
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
                let storage = creep.room.storage;
                if (storage){
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
                //path.findPath(creep);
            }

        }


        }
};
