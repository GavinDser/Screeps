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
  run: function(creep,source) {

    if(creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.repairing = false;
          creep.say('harvest!');
    }
    if(!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
        creep.say('Repair!');
    }

    if(creep.memory.repairing) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType !=  STRUCTURE_WALL &&  s.structureType != STRUCTURE_RAMPART && s.hits < s.hitsMax 
                
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
        if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.storage)
            }
        //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
        //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
        //   }
    }
}
};

