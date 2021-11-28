import { Repairer as repairer } from "./Repairer";
import { WallRepairer as wallRepairer } from "./WallRepairer";
export const Builder = {

  /** @param {Creep} creep **/
  run: function(creep,source) {

    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.building = false;
    }
    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        creep.memory.building = true;
    }

    if(creep.memory.building) {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
          if(targets.length) {
              if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                  creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
              }
          }
          else{
              wallRepairer.run(creep,source);
          }
    }
    else {



            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

            if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});          
        }
    }
}
};