import { Builder as builder } from "./Builder";
import { Harvester as harvester } from "./Harvester";
export const crossRoomBuilder = {

  /** @param {Creep} creep **/
  run: function(creep: Creep ): void {
    if(creep.room.name == "E39S47"){
        if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        
        if(creep.memory.working) {
            let towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure: StructureTower ) => {
                    return (structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] <= 300);
                }
            });
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            // if (towers.length){
            //     if (creep.transfer(towers[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //         creep.moveTo(towers[0])
            //     } 
            // }
            // if (towers.length){
            //     if (creep.transfer(towers[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //         creep.moveTo(towers[0])
            //     }
            // }
            // else if(targets.length) {
            //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            //     }
            // }

            // else{
                builder.run(creep);
            // }
            // if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.controller)
            // }
        }
        else {
            let sources = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 1500
            })
            let source = _.sortBy(sources, (s:StructureContainer)=> s.store[RESOURCE_ENERGY]).reverse();

            // if (source.length){
            //     if(creep.withdraw(source[0],RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            //         creep.moveTo(source[0]);                
            //     }
            // }
            if (creep.room.terminal){
                if(creep.withdraw(creep.room.terminal,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.terminal);
                }
            }
            else if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE), {visualizePathStyle: {stroke: '#ffaa00'}});          
            }

        }
    }
    else{
            if (creep.room.name == "E35S47"){
                let exit = creep.room.findExitTo('E36S47') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E36S47"){
                let exit = creep.room.findExitTo('E37S47') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S47"){
                let exit = creep.room.findExitTo('E37S46') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S46"){
                let exit = creep.room.findExitTo('E38S46') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else{
                creep.moveTo(new RoomPosition(11,14,"E39S47"))
            }




    }
}
};

// Game.spawns['Spawn1'].spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"冲！",{memory:{role:"crossRoomBuilder"}})