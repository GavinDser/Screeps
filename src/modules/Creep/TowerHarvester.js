import { Harvester as harvester } from './Harvester';
export const TowerHarvester = {

    /** @param {Creep} creep **/
    run: function(creep,source) {
	    if(creep.store.getFreeCapacity() > 0) {
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType ==  STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            // if nothing to store be a harvester
            }else {
                harvester.run(creep,source);
            }
        }
	}
};