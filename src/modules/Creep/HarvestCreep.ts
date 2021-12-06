export const HarvestCreep ={
    run: function(creep: Creep) {
        let source = Game.getObjectById(creep.memory.sourceId) as Source
        let container = source.pos.findInRange(FIND_STRUCTURES,1,{filter: {structureType: STRUCTURE_CONTAINER}})[0];

        if (!creep.pos.isEqualTo(container.pos)){
            creep.moveTo(container)
        }
        else{
            creep.harvest(source);
        }

    }
}
