import { Upgrader as upgrader } from "./Upgrader";
import { WallRepairer as wallRepairer } from "./WallRepairer";
export const Builder = {

  /** @param {Creep} creep **/
  run: function(creep: Creep ): void {

    if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
          creep.memory.working = false;
    }
    if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
        creep.memory.working = true;
    }

    if(creep.memory.working) {
        let storageBuild = creep.room.find(FIND_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType == STRUCTURE_STORAGE
        })
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length) {
            if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else{
            wallRepairer.run(creep);
            
        }
    }
    else {


        let sources = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1800
        })
        let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
        if (source.length){
            if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(source[0]);
            }
        }
        else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 300){
            if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.storage)
            }
        }
        else{
            if (creep.memory.sourceId){
                if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE){
                    creep.moveTo(Game.getObjectById(creep.memory.sourceId))
                }
            }
            // else{
            //     if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
            //     }
            // }
        }
    }
}
};