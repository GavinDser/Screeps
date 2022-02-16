export const Carrier = {
    run: function(creep:Creep){
        for (const resourceType in creep.room.terminal.store){
            if (creep.store.getUsedCapacity() != 0){
                for (const resource in creep.store){
                    if (creep.transfer(creep.room.storage, resource as ResourceConstant) == ERR_NOT_IN_RANGE){
                        creep.moveTo(creep.room.storage)
                    }
                }
            }
            else {
                if(creep.withdraw(creep.room.terminal,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.terminal)
                }
            }
        }
        
    }
}