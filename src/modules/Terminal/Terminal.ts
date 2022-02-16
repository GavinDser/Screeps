export const Terminal = {
    prepareBuyOrder: function(creep: Creep , orderId: string): number {
        let order = Game.market.getOrderById(orderId);
        // order is not found or order id is wrong
        if (order == undefined){
            return -100;
        }
        else{
            let cost = Game.market.calcTransactionCost(order.amount,creep.room.name,order.roomName);
            if (creep.room.terminal.store[RESOURCE_ENERGY] < cost){
                creep.withdraw(creep.room.storage,RESOURCE_ENERGY);
                creep.transfer(creep.room.terminal,RESOURCE_ENERGY);
                return -1;
            }
            //够满则return 0
            else{
                return 0;
            }
        }
        
    },

    transferResource: function(creep: Creep, resourceT: ResourceConstant, amount: number, targetRoom: string) : number{
        let cost = Game.market.calcTransactionCost(amount,creep.memory.homeRoom,targetRoom);
        let total;
        if (resourceT == RESOURCE_ENERGY){
            total = cost + amount;
        }
        else{
            total = amount
        }
        if (creep.room.terminal.store[RESOURCE_ENERGY] < cost){
            if (creep.store[RESOURCE_ENERGY] == creep.store.getCapacity()){
                creep.transfer(creep.room.terminal,RESOURCE_ENERGY);
            }
            else{
                creep.withdraw(creep.room.storage,RESOURCE_ENERGY);
            }
            return -1;
        }
        
        else if(creep.room.terminal.store[resourceT] < total){
            if (creep.store[resourceT] == creep.store.getCapacity()){
                creep.transfer(creep.room.terminal,resourceT);
            }
            else{
                creep.withdraw(creep.room.storage,resourceT);
            }
            return -1;
        }
        //够满则return 0
        else{
            return 0;
        }
    }



}

// 放在room terminal的memory
