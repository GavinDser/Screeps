export const Path = {
    findPath: function(creep : Creep, path){
        
        if(creep.memory.path.length){
            if (creep.room.name != creep.memory.path[0]){
                let exit = creep.room.findExitTo(creep.memory.path[0]) as FindConstant;
                creep.moveTo(creep.pos.findClosestByRange(exit))
            }
        }
        else {
            return 0;
        }
    }
}