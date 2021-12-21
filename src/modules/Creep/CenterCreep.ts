export const CenterCreep = {
    run: function(creep: Creep): void {
        if (!(creep.pos.isEqualTo(new RoomPosition(12,18,"E35S47")))){
            creep.moveTo(new RoomPosition(12,18,"E35S47"))
        }
        else{
            var terminal = creep.room.terminal;
            var storage = creep.room.storage;
            var link = Game.getObjectById('61a3f58732b74f02f5a76f1a') as StructureLink;
            if (link.store.getUsedCapacity(RESOURCE_ENERGY)> 0){
                creep.withdraw(link,RESOURCE_ENERGY);
                creep.transfer(storage,RESOURCE_ENERGY)
            }
            // else if (terminal.store.getUsedCapacity() > 0){
            //     for (const resourceType in terminal.store){
            //         creep.withdraw(terminal,resourceType as ResourceConstant);
            //         creep.transfer(storage,resourceType as ResourceConstant);
            //     }
            // }
            // let fittedOrder = Game.market.getAllOrders((order)=> order.type == ORDER_BUY && order.resourceType == RESOURCE_ENERGY
            // && Game.market.calcTransactionCost)
            //if (storage.store[RESOURCE_ENERGY] > 200000)



            // Game.market.createOrder({type:ORDER_SELL,resourceType: RESOURCE_ENERGY,price:700000,totalAmount: 1,roomName:'E35S47'})



            let order = Game.market.getOrderById('61bcbef7e30181cb81a9b5c2');
            if(order){
                let cost = Game.market.calcTransactionCost(order.amount,'E35S47',order.roomName);
                if (terminal.store[RESOURCE_ENERGY] < order.amount+cost){
                    creep.withdraw(storage,RESOURCE_ENERGY);
                    creep.transfer(terminal,RESOURCE_ENERGY);
                }
                else{
                    console.log(Game.market.deal(order.id,order.amount,"E35S47"));
                }

            }
            else{
                for (const resourceType in creep.store){
                    creep.transfer(storage,resourceType as ResourceConstant)
                    
                }
                    
            }
        }
    }
}