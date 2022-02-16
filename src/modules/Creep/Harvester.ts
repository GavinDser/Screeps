import { Builder as builder } from "./Builder";
export const Harvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) : void {
        if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        
        if (creep.memory.working){
            let extensions = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure: StructureExtension ) => {
                        return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    }
            });
            let spawns = creep.room.find(FIND_STRUCTURES, {filter: (s: AnyStructure)=> s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});

            let labs = creep.room.find(FIND_STRUCTURES, {
                filter: (s: StructureLab) => {
                    return (s.structureType == STRUCTURE_LAB && s.store[RESOURCE_ENERGY] < 1500)
                }
            })

            extensions = _.sortBy(extensions, (s: StructureExtension ) => creep.pos.getRangeTo(s));//creep.pos.getRangeTo
            if(extensions.length) {
                if(creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(extensions[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else if(spawns.length){
                if (creep.transfer(spawns[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(spawns[0]);
                }
            }
            // if extensions and spawns are full
            else if(labs.length) {
                if(creep.transfer(labs[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            //if nothing to store or carrying not ENERGY-ONLY
            else{
                if (creep.room.storage){
                    let storage = creep.room.storage;
                    for (const resourceType in creep.store){
                        if (creep.transfer(storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            creep.moveTo(storage)
                        }
                    }
                }
                //删
                else{
                    builder.run(creep);
                }

            }

        }
        else{
            let link = Game.getObjectById(creep.memory.linkId) as StructureLink

            if(link && link.store[RESOURCE_ENERGY] > 0){
                if (creep.withdraw(link,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(link)
                }        
            }
        

            else{
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                })
                let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()

                if (creep.memory.stateSwitch == false){
                    if (source.length){
                        creep.memory.containerId = source[0].id;
                        creep.memory.stateSwitch = true;
                    }
                }
                if (source.length){
                    if (creep.withdraw(Game.getObjectById(creep.memory.containerId),RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(Game.getObjectById(creep.memory.containerId));
                    }
                    else{
                        creep.memory.stateSwitch = false;
                    }
                }
                else{
                    
                    if (creep.memory.sourceId){
                        if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE){
                            creep.moveTo(Game.getObjectById(creep.memory.sourceId))
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
        }
};
