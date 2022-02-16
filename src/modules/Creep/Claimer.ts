export const Claimer = {
    run: function(creep: Creep): void {
        if (creep.room.name == creep.memory.targetRoom){
            if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.controller,{ignoreSwamps: true,maxRooms:0});
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit),{ignoreSwamps: true});
            
        }
    }
}