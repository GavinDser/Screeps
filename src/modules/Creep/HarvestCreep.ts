export const HarvestCreep ={
    run: function(creep: Creep) {
        let source = Game.getObjectById(creep.memory.sourceId) as Source;
        let container = source.pos.findInRange(FIND_STRUCTURES,1,{filter: {structureType: STRUCTURE_CONTAINER}})[0];
        let link = source.pos.findInRange(FIND_STRUCTURES,2,{filter: {structureType: STRUCTURE_LINK}})[0];

        let position;

        if (container && !creep.pos.isEqualTo(container.pos)){
            creep.moveTo(container)
        }
        else{
            if (link){
                creep.transfer(link,RESOURCE_ENERGY);
            }
            creep.harvest(source);
        }

    }
}
