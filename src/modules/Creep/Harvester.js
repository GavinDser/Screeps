import { Upgrader as upgrader } from "./Upgrader";
export const Harvester = {

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
        
        if (!creep.memory.harvesting){
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            targets = _.sortBy(targets, (s) => creep.pos.getRangeTo(s));
            if(targets.length && creep.store[RESOURCE_ENERGY] == creep.store.getUsedCapacity()) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            //if nothing to store
            else{
                var storage = creep.room.storage;
                for (const resourceType in creep.store){
                    if (creep.transfer(storage,resourceType) == ERR_NOT_IN_RANGE){
                        creep.moveTo(storage)
                    }
                }
            

            }

        //// transfer all resources
// for(const resourceType in creep.carry) {
//     creep.transfer(storage, resourceType);
// }

        }else{
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }


            var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 10
                });

            // var tombEnergy = creep.room.find(FIND_TOMBSTONES, {
            //     filter: (s) => s.creep.store != null
            // });
            // console.log(tombEnergy)
            
            if (droppedEnergy.length){
                if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                    creep.moveTo(droppedEnergy[0]);
                }
            }

            // else if(tombEnergy.length){
            //     for (const resourceType in tombEnergy[0].store){
            //         if (creep.withdraw(tombEnergy[0],resourceType) == ERR_NOT_IN_RANGE){
            //             creep.moveTo(tombEnergy[0])
            //         }
            //     }
            // }

            else {
                if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                  }
            }

          }
        }
};
