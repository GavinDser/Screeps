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
                if (creep.transfer(link,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    creep.moveTo(link);
                }    
            }
            if(creep.harvest(source) == ERR_NOT_IN_RANGE){
                creep.moveTo(source);
            }
        }

    }
}
