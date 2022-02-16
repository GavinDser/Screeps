//删
import { Harvester as harvester } from "./Harvester";
export const crossRoomAttacker = {
    run: function(creep: Creep): void {
        if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }
        if (creep.room.name == creep.memory.targetRoom){
            if (creep.memory.working){
                // if(creep.transfer(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                //     creep.moveTo(creep.room.storage)
                // }
                harvester.run(creep);
            }
            else{
                let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 0
                });
                droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse();
                if(creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                    creep.moveTo(droppedEnergy[0])
                }
            }
        }
        else{
            creep.moveTo(new RoomPosition(10,25,'E37S48'));
        }
    }
}