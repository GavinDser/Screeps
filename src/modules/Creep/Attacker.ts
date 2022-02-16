export const Attacker = {
    run: function(creep: Creep): void {
        if (creep.room.name == creep.memory.targetRoom){
            let t;
            let sInvaderCore = creep.room.find(FIND_STRUCTURES, {filter: (s:AnyStructure) => s.structureType == STRUCTURE_INVADER_CORE})
            let enemyCreep = creep.room.find(FIND_HOSTILE_CREEPS,{filter:(c)=> global.whiteList.indexOf(c.owner.username) === -1});
            let damagedCreep = creep.room.find(FIND_MY_CREEPS, {filter:(c)=> c.hits<c.hitsMax});

            let position;

            if(creep.memory.homeRoom == "E35S47"){
                position = new RoomPosition(7,21,creep.memory.targetRoom);
            }
            else if (creep.memory.homeRoom == "E39S47"){
                position = new RoomPosition(12,7,creep.memory.targetRoom);
            }

            if (enemyCreep.length){
                t = enemyCreep[0]
            }
            else if (sInvaderCore.length){
                t = sInvaderCore[0]
            }

            if (creep.attack(t) == ERR_NOT_IN_RANGE){
                creep.moveTo(t.pos)
            }
            else if (creep.rangedAttack(t) == ERR_NOT_IN_RANGE){
                creep.moveTo(t.pos)
            }
            if (!sInvaderCore.length && !enemyCreep.length){
                creep.moveTo(position,{ignoreSwamps:true});
            }
            if (creep.pos.isEqualTo(position)){
                if(damagedCreep.length){
                    creep.heal(damagedCreep[0])
                }
                else{
                    creep.heal(creep);   
                }         
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
}