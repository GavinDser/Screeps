export const Attacker = {
    run: function(creep: Creep, targetStructure: AnyStructure): void {
        if (creep.room.name == creep.memory.targetRoom){
            let t;
            let sInvaderCore = creep.room.find(FIND_STRUCTURES, {filter: (s:AnyStructure) => s.structureType == STRUCTURE_INVADER_CORE})
            let enemyCreep = creep.room.find(FIND_HOSTILE_CREEPS);
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
                creep.heal(creep);
                creep.moveTo(new RoomPosition(7,21,creep.memory.targetRoom));
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
}