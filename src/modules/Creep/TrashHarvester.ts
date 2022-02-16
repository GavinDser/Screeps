import { Harvester as harvester } from "./Harvester";
import { Upgrader as upgrader } from "./Upgrader";
import { Builder as builder} from "./Builder";
export const TrashHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) : void {
        let tombEnergy = creep.room.find(FIND_TOMBSTONES, {
            filter: (s) => s.store.getUsedCapacity() > 0
        });
        let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (d) => d.amount >= 500
        });
        droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse()

        let ruinEnergy = creep.room.find(FIND_RUINS, {
            filter: (s) => s.store.getUsedCapacity() > 0
        })
        droppedEnergy = _.sortBy(droppedEnergy, (s) => creep.pos.getRangeTo(s));


        if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if(creep.room.name == creep.memory.homeRoom){
            if (creep.memory.working){
                if (creep.store[RESOURCE_ENERGY] != creep.store.getUsedCapacity()){
                    for (const resourceType in creep.store){
                        if (creep.transfer(creep.room.storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.storage)
                        }
                    }
                    
                }
                else{
                    let extensions = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure: StructureExtension ) => {
                            return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                        }
                    });
                    let spawns = creep.room.find(FIND_STRUCTURES, {filter: (s: AnyStructure)=> s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                    let towers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure: StructureTower ) => {
                            return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 600);
                        }
                    });
                    let labs = creep.room.find(FIND_STRUCTURES, {
                        filter: (s: StructureLab) => {
                            return (s.structureType == STRUCTURE_LAB && s.store[RESOURCE_ENERGY] < 2000)
                        }
                    })
                    if (spawns.length || extensions.length){
                        harvester.run(creep);
                    }
                    else if (towers.length){
                        if(creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(towers[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }

                    else if (tombEnergy.length || ruinEnergy.length || droppedEnergy.length){
                        //删
                        if (creep.transfer(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.storage)
                        }
                    }
                    else if (labs.length){
                        if(creep.transfer(labs[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(labs[0]);
                        }
                    }
                    else{
                        if (creep.room.controller.level == 8){
                            builder.run(creep);
                        }
                        else{
                            upgrader.run(creep);
                        }
                    }
                }

            }
            else{
                let containerNonEnergy = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] != s.store.getUsedCapacity()
                }) as StructureContainer[];



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

                else if (containerNonEnergy.length){
                    for (const resourceType in containerNonEnergy[0].store){
                        if (creep.withdraw(containerNonEnergy[0],resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(containerNonEnergy[0])
                        }
                    }
                }                
                else{
                    let sources = creep.room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1800
                    })
                    let source = _.sortBy(sources, (s: StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()

                
                    if (source.length){
                        if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(source[0]);
                        }
                    }
                    else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 500){
                        if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.storage)
                        }
                    }
                    else {
                        if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
                        }
                    }
                }
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.homeRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
};
