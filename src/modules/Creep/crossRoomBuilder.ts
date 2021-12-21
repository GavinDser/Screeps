//删
export const crossRoomBuilder = {

  /** @param {Creep} creep **/
  run: function(creep: Creep ): void {
    if(creep.room.name == "E39S47"){
        if(creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
        }
        if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        
        if(creep.memory.working) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            // if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE){
            //     creep.moveTo(creep.room.controller)
            // }
        }
        else {

                if(creep.harvest(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)) == ERR_NOT_IN_RANGE) {
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
                let exit = creep.room.findExitTo('E36S48') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E36S48"){
                let exit = creep.room.findExitTo('E36S49') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E36S49"){
                let exit = creep.room.findExitTo('E37S49') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S49"){
                let exit = creep.room.findExitTo('E37S50') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E37S50"){
                let exit = creep.room.findExitTo('E38S50') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E38S50"){
                let exit = creep.room.findExitTo('E39S50') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E39S50"){
                let exit = creep.room.findExitTo('E40S50') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E40S50"){
                let exit = creep.room.findExitTo('E40S49') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E40S49"){
                let exit = creep.room.findExitTo('E40S48') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E40S48"){
                let exit = creep.room.findExitTo('E40S47') as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
            }
            else if (creep.room.name == "E40S47"){
                creep.moveTo(new RoomPosition(15,16,'E39S47'))
            }




    }
}
};

// Game.spawns['Spawn1'].spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"冲！",{memory:{role:"crossRoomBuilder"}})