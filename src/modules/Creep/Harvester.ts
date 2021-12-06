import { StructuredType } from "typescript";
import { Upgrader as upgrader } from "./Upgrader";
export const Harvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) : void {
        if(!creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }
        
        if (!creep.memory.working){
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure: AnyStructure ) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            targets = _.sortBy(targets, (s: StructureExtension | StructureTower ) => s.store[RESOURCE_ENERGY]);//creep.pos.getRangeTo
            var spawns = creep.room.find(FIND_STRUCTURES, {filter: (s: AnyStructure)=> s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
            if(targets.length && creep.store[RESOURCE_ENERGY] == creep.store.getUsedCapacity()) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            // if tower and extensions are full
            else if(spawns.length && creep.store[RESOURCE_ENERGY] == creep.store.getUsedCapacity()){
                if (creep.transfer(spawns[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(spawns[0]);
                }
            }
            //if nothing to store or carrying not ENERGY-ONLY
            else{
                var storage = creep.room.storage;
                for (const resourceType in creep.store){
                    if (creep.transfer(storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                        creep.moveTo(storage)
                    }
                }

            }

        }else{
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }


            var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 10
                });

            var tombEnergy = creep.room.find(FIND_TOMBSTONES, {
                filter: (s) => s.store.getUsedCapacity() > 0
            });
            
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

            else {
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                })
                let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
                if (source.length){
                    if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(source[0]);
                    }
                }
                else{
                    if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                }
            }

          }
        }
};
