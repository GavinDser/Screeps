import { Harvester as harvester } from "./Harvester";
import { Builder as builder } from "./Builder";

export const CrossSourceHarvester = {

    /** @param {Creep} creep **/
    run: function(creep: Creep) {
        if(!(creep.hits < creep.hitsMax)){
            if(creep.memory.working && creep.store.getUsedCapacity() == 0) {
                creep.memory.working = false;
            }
            if(!creep.memory.working && creep.store.getFreeCapacity() == 0) {
                creep.memory.working = true;
            }
            
            if (!creep.memory.working){
                let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (d) => d.amount >= 500
                });
                droppedEnergy = _.sortBy(droppedEnergy, (e) => e.amount).reverse()
                let source = Game.getObjectById(creep.memory.sourceId) as Source;
                if (creep.room.name == creep.memory.targetRoom){
                    if (droppedEnergy.length){
                        if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE){
                            creep.moveTo(droppedEnergy[0],{ignoreSwamps: true})
                        }
                    }
                    else if(creep.harvest(source) == ERR_NOT_IN_RANGE){
                        creep.moveTo(source,{ignoreSwamps: true});
                    }
                    
                    
                }
                // if creep is not in the target room
                else{
                    
                        let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
                        creep.moveTo(creep.pos.findClosestByRange(exit));
                }

            
            // finished harvesting
            }
            else{
                if (creep.room.name == creep.memory.homeRoom){
                    let link = Game.getObjectById(creep.memory.linkId) as StructureLink;
                    if (link && link.store.getFreeCapacity(RESOURCE_ENERGY)!= 0){
                        if (creep.transfer(link,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                            creep.moveTo(link);
                        }
                    }
                    else if (creep.room.storage){
                        if (creep.transfer(creep.room.storage,RESOURCE_ENERGY)== ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.storage)
                        }
                    }
                    else{
                        harvester.run(creep);
                    }
                    
                }
                
                // if not in home room
                else{
                    let exit = creep.room.findExitTo(creep.memory.homeRoom) as FindConstant;
                    creep.moveTo(creep.pos.findClosestByRange(exit),{ignoreSwamps: true});
                }

            }
        }
        else{
            let position;
            if (creep.memory.homeRoom == "E35S47"){
                position = new RoomPosition(7,22,creep.memory.targetRoom)
            }
            else if (creep.memory.homeRoom == "E39S47"){
                position = new RoomPosition(12,8,creep.memory.targetRoom)
            }
        }
        
    }
};
