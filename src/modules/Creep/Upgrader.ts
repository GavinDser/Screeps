/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Upgrader');
 * mod.thing == 'a thing'; // true
 */


export const Upgrader = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) {

        if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
	    }
	    if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
	        creep.memory.working = true;
	    }
	    if(creep.memory.working) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            // if(creep.signController(creep.room.controller,"Farmer player 😣") == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.controller)
            // }
        }
        else {
            if (!creep.memory.controllerSource){
                let sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1500
                })
                let source = _.sortBy(sources, (s: StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse()
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
                else if (creep.memory.sourceId){
                    if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE){
                        creep.moveTo(Game.getObjectById(creep.memory.sourceId));
                    }
                }
            }
            else{
                if(creep.memory.stateSwitch){
                    if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});                       
                    }
                    creep.upgradeController(creep.room.controller)
                    creep.memory.stateSwitch = false;
                }
                else{
                    creep.upgradeController(creep.room.controller)
                    creep.memory.stateSwitch = true;
                }

            
            }
        }
	}
};