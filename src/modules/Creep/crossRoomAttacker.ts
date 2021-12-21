//删
export const crossRoomAttacker = {
    run: function(creep: Creep): void {
        // if (creep.room.name == creep.memory.targetRoom){
            if(creep.attack(Game.getObjectById('614d28a28b0a09db61bc812e'))== ERR_NOT_IN_RANGE){
                creep.moveTo(Game.getObjectById('614d28a28b0a09db61bc812e'));
            }
        // }
        // else{
            //let exit = creep.room.findExitTo('E39S47') as FindConstant;
            // creep.moveTo(new RoomPosition(15,16,'E39S47'));
        }
    // }
}