/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/
import { Upgrader as upgrader } from "./Upgrader";
export const WallRepairer = {

  /** @param {Creep} creep **/
  run: function(creep) {

    if(creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
          creep.memory.repairing = false;
    }
    if(!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
    }

    if(creep.memory.repairing) {


        var ramparts = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType ==  STRUCTURE_RAMPART && (s.hits/s.hitsMax) < 0.6
            
        });
        var findRampart = function(){
            let rampart = _.sortBy(ramparts, (r)=> r.hits/r.hitsMax)
            return rampart[0];
        }
        if (ramparts.length){
            if (creep.memory.target == '' || creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART){
                creep.memory.target = findRampart();     
            }
            else if (creep.memory.target != undefined && creep.memory.target.hits/creep.memory.target.hitsMax < 0.6){
                if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else {
                creep.memory.target = ''
            }
        }
        else{     
            var walls = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                  return (s.structureType == STRUCTURE_WALL && s.hits/s.hitsMax < 0.3)
                          
                } });

            var findTarget = function(){
                let wall = _.sortBy(walls,(w)=> w.hits/w.hitsMax);
                return wall[0];
            }
            if (creep.memory.target == "" || creep.memory.target == undefined){
                creep.memory.target = findTarget();
                if (!creep.memory.target){
                    upgrader.run(creep)
                }
            }
            else if (creep.memory.target.hits/creep.memory.target.hitsMax < 0.3){
                    if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
            }
            else{
                creep.memory.target = "";
            }
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
