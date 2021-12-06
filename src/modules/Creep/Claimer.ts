export const Claimer = {
    run: function(creep: Creep): void {
        if (creep.room.name == creep.memory.targetRoom){
            if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.controller);
            }
            else if(creep.reserveController(creep.room.controller) == ERR_INVALID_TARGET){
                creep.attackController(creep.room.controller);
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
}