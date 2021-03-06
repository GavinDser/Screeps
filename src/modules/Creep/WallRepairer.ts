/*
* Module code goes here. Use 'module.exports' to export things:
* module.exports.thing = 'a thing';
*
* You can import it from another modules like this:
* var mod = require('Repairer');
* mod.thing == 'a thing'; // true
*/

import { createRestTypeNode } from "typescript";

//import { Upgrader as upgrader } from "./Upgrader";
export const WallRepairer = {

  /** @param {Creep} creep **/
  run: function(creep: Creep) {

    if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
          creep.memory.working = false;
    }
    if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
        creep.memory.working = true;
    }

    if(creep.memory.working) {
        let setPercentage;
        if (creep.memory.homeRoom == "E35S47"){
            setPercentage = 0.25
        }
        else{
            setPercentage = 1
        }
        var ramparts = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => 
                s.structureType ==  STRUCTURE_RAMPART && (s.hits/s.hitsMax < setPercentage)
            
        });
        var findRampart = function(){
            let rampart = _.sortBy(ramparts, (r)=> (r.hits/r.hitsMax))
            return rampart[0];
        }
        var newRampart = function(){
            let rampart = ramparts.filter((r)=> r.hits < 100)
            return rampart;
        }
        if (ramparts.length){
            if (creep.memory.target == undefined || creep.memory.target.structureType != STRUCTURE_RAMPART){
                if (newRampart().length){
                    creep.memory.target = newRampart()[0];
                }
                else{
                    creep.memory.target = findRampart();     
                }
            }
            else if (creep.memory.target != undefined && creep.memory.target.hits<creep.memory.target.hitsMax){
                if (newRampart().length && creep.memory.target.id != newRampart()[0].id){
                    creep.memory.target = undefined
                }
                else if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else {
                creep.memory.target = undefined
            }
        }
        else{    
            var walls = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                  return (s.structureType == STRUCTURE_WALL && s.hits/s.hitsMax)
                          
                } });

            var findTarget = function(){
                let wall = _.sortBy(walls,(w)=> w.hits/w.hitsMax);
                return wall[0];
            }
            if (creep.memory.target == undefined){
                creep.memory.target = findTarget();
                if (!creep.memory.target){
                    //upgrader.run(creep)
                }
            }
            else if (creep.memory.target.hits/creep.memory.target.hitsMax){
                    if(creep.repair(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
                    }
            }
            else{
                creep.memory.target = undefined;
            }
        }

              

    }
    else {
            // if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.storage)
            // }

        //   if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
        //       creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});
        //   }
        let sources = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        })
        let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
        if (source.length){
            if (creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(source[0]);
            }
        }
        // else{
        //     if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
        //         creep.moveTo(creep.room.storage)
        //     }
        // }

    }
}
};
