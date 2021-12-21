export const RoomClaimer = {
    run: function(creep: Creep): void {
        let creepPath = creep.memory.path;
        let pathLength = creepPath.length;
        let currentPath;
        if(pathLength > 0){
            currentPath = creepPath[0];
            if (creep.room.name != currentPath){
                let exit = creep.room.findExitTo(currentPath) as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit));
                creep.heal(creep)
            }
            else {
                creepPath.shift()
            }
        }
        else{
            if (creep.room.name == creep.memory.path[0]){
                if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                    creep.heal(creep);
                }
            }
            else{
            }

        }
    }
}
///['E36S47','E37S47','E37S46','E38S46','E39S46','E39S47']