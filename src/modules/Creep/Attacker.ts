export const Attacker = {
    run: function(creep: Creep, targetStructure: AnyStructure): void {
        if (creep.room.name == creep.memory.targetRoom){
            if (creep.attack(targetStructure) == ERR_NOT_IN_RANGE){
                creep.moveTo(targetStructure.pos)
            }
            else if (creep.rangedAttack(targetStructure) == ERR_NOT_IN_RANGE){
                creep.moveTo(targetStructure.pos)
                creep.heal(creep);
            }
        }
        else{
            let exit = creep.room.findExitTo(creep.memory.targetRoom) as FindConstant;
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
    }
}