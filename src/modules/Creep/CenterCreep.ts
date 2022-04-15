import { repeat } from "lodash";
import { factory } from "typescript";
import { Terminal as terminal } from "../Terminal/Terminal"

//解决： centercreep会有莫名奇妙存留在自身的energy无法清零的情况
export const CenterCreep = {
    run: function(creep: Creep): void {
        if (!(creep.pos.isEqualTo(new RoomPosition(creep.memory.position[0],creep.memory.position[1],creep.memory.homeRoom)))){
            creep.moveTo(new RoomPosition(creep.memory.position[0],creep.memory.position[1],creep.memory.homeRoom))
        }
        else{
            if (creep.memory.homeRoom == "E35S47"){
                let linkPoint = Game.getObjectById('61a3f58732b74f02f5a76f1a') as StructureLink;
                let factory = Game.getObjectById("61ba7016a2783d8fd293aaab") as StructureFactory;

                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                    for (const resourceType in creep.store){
                        if (creep.transfer(creep.room.storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                        }
                    }
                    creep.withdraw(linkPoint,RESOURCE_ENERGY);
                    
                }
                else if (factory.cooldown < 6 && creep.room.storage.store[RESOURCE_ZYNTHIUM] > 5000){
                    if (creep.store[RESOURCE_ZYNTHIUM_BAR] > 0){
                        creep.transfer(creep.room.storage,RESOURCE_ZYNTHIUM_BAR);
                    }
                    else if (factory.store[RESOURCE_ZYNTHIUM_BAR] > 0){    
                        creep.withdraw(factory,RESOURCE_ZYNTHIUM_BAR);
                    }
                    else if (creep.store[RESOURCE_ZYNTHIUM] > 0){
                        creep.transfer(factory,RESOURCE_ZYNTHIUM);
                    }
                    else if (factory.store[RESOURCE_ENERGY] < 200 && creep.room.storage[RESOURCE_ZYNTHIUM] > 6000){
                        creep.transfer(factory,RESOURCE_ENERGY)
                        creep.withdraw(creep.room.storage,RESOURCE_ENERGY);
                    }

                    else if (factory.store[RESOURCE_ZYNTHIUM] < 500 && creep.room.storage[RESOURCE_ZYNTHIUM] > 6000){
                        creep.withdraw(creep.room.storage,RESOURCE_ZYNTHIUM);
                    }
                    else{
                        if (factory.cooldown < 1){
                            factory.produce(RESOURCE_ZYNTHIUM_BAR);
                        }
                    }
                    
                }
                // else if (creep.memory.working == true){
                //     // console.log('hw')
                //     if (terminal.transferResource(creep,RESOURCE_ENERGY,100000,'E37S48') == 0){
                //         if(creep.room.terminal.send(RESOURCE_ENERGY,100000,"E37S48") == 0){
                            
                //             creep.memory.working = false
                //         }
                //     }
                // }
            }
            if (creep.memory.homeRoom == "E39S47"){
                let factory = Game.getObjectById("61e5f5e94aca3a629c20a8e7") as StructureFactory;
                let linkPoint = Game.getObjectById('61e4e758883aa8f6df8c1c5d') as StructureLink;
                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                    for (const resourceType in creep.store){
                        if (creep.transfer(creep.room.storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                        }
                    }
                    creep.withdraw(linkPoint,RESOURCE_ENERGY);
                    
                }
                else if (creep.room.terminal.store[RESOURCE_ENERGY] > 0){
                    if (creep.store.getFreeCapacity() == 0){
                        for (const resourceType in creep.store){
                            if (creep.transfer(creep.room.storage,resourceType as ResourceConstant) == ERR_NOT_IN_RANGE){
                            }
                        }
                    }
                    else{
                        creep.withdraw(creep.room.terminal,RESOURCE_ENERGY);
                    }
                }
                else if (factory.cooldown < 6 && creep.room.storage.store[RESOURCE_UTRIUM] > 5000){
                    if (creep.store[RESOURCE_UTRIUM_BAR] > 0){
                        creep.transfer(creep.room.storage,RESOURCE_UTRIUM_BAR);
                    }
                    else if (factory.store[RESOURCE_UTRIUM_BAR] > 0){    
                        creep.withdraw(factory,RESOURCE_UTRIUM_BAR);
                    }
                    else if (creep.store[RESOURCE_UTRIUM] > 0){
                        creep.transfer(factory,RESOURCE_UTRIUM);
                    }
                    else if (factory.store[RESOURCE_ENERGY] < 200 && creep.room.storage[RESOURCE_UTRIUM] > 6000){
                        creep.transfer(factory,RESOURCE_ENERGY)
                        creep.withdraw(creep.room.storage,RESOURCE_ENERGY);
                    }

                    else if (factory.store[RESOURCE_UTRIUM] < 500 && creep.room.storage[RESOURCE_UTRIUM] > 6000){
                        creep.withdraw(creep.room.storage,RESOURCE_UTRIUM);
                    }
                    else{
                        if (factory.cooldown < 1){
                            factory.produce(RESOURCE_UTRIUM_BAR);
                        }
                    }
                    
                }

            }
            if (creep.memory.homeRoom == "E37S48"){
                let linkPoint = Game.getObjectById('61e7d673c32f8f7570ad7e44') as StructureLink;

                if (linkPoint && linkPoint.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
                    creep.withdraw(linkPoint,RESOURCE_ENERGY);
                }
                if (creep.room.terminal.store[RESOURCE_ENERGY] > 0 && creep.store[RESOURCE_ENERGY] != creep.store.getCapacity()){
                    creep.withdraw(creep.room.terminal,RESOURCE_ENERGY)
                }
                else{
                    creep.transfer(creep.room.storage,RESOURCE_ENERGY);
                }
            }
        }
    }
}