export const Miner = {
    run: function(creep: Creep): void {
        if(!creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = true;
        }
        if(creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = false;
        }

        if (!creep.memory.working){
            var storage = creep.room.storage;
            for (const resourceType in creep.store){
                if (creep.transfer(storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                    creep.moveTo(storage)
                }
            }
        }
        else{
            if(creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.getObjectById(creep.memory.sourceId));
            }  
        }
    }
}