import { Builder as builder } from "./Builder";
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
            var extensions = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure: StructureExtension ) => {
                        return (structure.structureType == STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    }
            });
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure: StructureTower ) => {
                    return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 500);
                }
            });
            var spawns = creep.room.find(FIND_STRUCTURES, {filter: (s: AnyStructure)=> s.structureType == STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});


            extensions = _.sortBy(extensions, (s: StructureExtension ) => creep.pos.getRangeTo(s));//creep.pos.getRangeTo
            towers = _.sortBy(towers, (s:  StructureTower ) => creep.pos.getRangeTo(s));//creep.pos.getRangeTo
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
            else if(towers.length) {
                if(creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(towers[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            //if nothing to store or carrying not ENERGY-ONLY
            else{
                if (creep.room.storage){
                    var storage = creep.room.storage;
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

        }else{
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }


            var unfilledExtension = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }
            )
            let link1;
            let link0;
            if (creep.memory.linkList != undefined){
                link1 = Game.getObjectById(creep.memory.linkList[1] as StructureConstant) as StructureLink
                link0 = Game.getObjectById(creep.memory.linkList[0] as StructureConstant) as StructureLink
            }
            if(link1 && link1.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && unfilledExtension.length){

                if (creep.withdraw(link1,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(link1)
                }        
            }

            else if(link0 && link0.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && !(unfilledExtension.length)){
                if (creep.withdraw(link0,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(link0)
                }        
            }
        

            else{

                
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
