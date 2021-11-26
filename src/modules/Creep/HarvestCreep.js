export const HarvestCreep ={
    run: function(creep,source) {
        if (creep.room.name != creep.memory.target){
            let exit = creep.room.findExitTo(creep.memory.target);
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
        else{
        
            if (creep.harvest(source) == ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
        }
    }
}