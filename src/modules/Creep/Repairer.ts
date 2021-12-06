/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/
import { Upgrader as upgrader } from "./Upgrader";

export const Repairer = {

  /** @param {Creep} creep **/
  run: function(creep: Creep ) {

    if(creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.working = false;
    }
    if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
        creep.memory.working = true;
    }

    if(creep.memory.working) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType !=  STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax 
                
        });
        var target = _.sortBy(targets,(r)=> r.hits/r.hitsMax)
        if(target.length) {
            if(creep.repair(target[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        // if nothing to repair
        else{
            upgrader.run(creep);
            }
    } 
    else {
        //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
        //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
        //   }
        let sources = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 300
        })
        let source = _.sortBy(sources, (s: StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
        if (source.length){
            if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(source[0]);
            }
        }
        else{
            if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.storage)
            }
        }
    }
}
};

