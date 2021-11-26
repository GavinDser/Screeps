
export const spawnChange = function(){
  StructureSpawn.prototype.createAverageCreep = function(energy,roleName,name){
    var numParts = Math.floor(energy/200);
    var body = [];
    for (let i = 0; i< numParts; i++){
      body.push(WORK);
    }
    for (let i = 0; i< numParts; i++){
      body.push(CARRY);
    }
    for (let i = 0; i< numParts; i++){
      body.push(MOVE);
    }

    return this.spawnCreep(body,name,{memory: {role: roleName}});
  }

  StructureSpawn.prototype.createPercentageCreep = function(percentageWork,energy,roleName,name,home,target){
    var workParts = Math.floor(energy * percentageWork/150);
    var body = []
    for (let i = 0; i < workParts; i ++){
      body.push(WORK);
    }
    energy -= workParts * 150;
    var carryParts = Math.floor(energy/100);
    for (let i = 0; i < carryParts; i++){
      body.push(CARRY);
    }
    for (let i = 0; i < carryParts+workParts; i++){
      body.push(MOVE);
    }
    return this.spawnCreep(body,name,{memory: {role: roleName, home: home, target: target}});
  }



  StructureSpawn.prototype.createSoloCreep = function(typeCreep,energy,roleName,name,home, target){
    var workParts = Math.floor((energy - 250)/100);
    var body = []
    if (typeCreep == 'work'){
      for (let i = 0; i < workParts; i++){
        body.push(WORK);
      }
    }else if (typeCreep == "carry"){
      for (let i = 0; i < workParts; i++){
        body.push(CARRY);
      }
    }

    for (let i = 0; i < 5; i++){
      body.push(MOVE);
    }
    return this.spawnCreep(body,name,{memory: {role: roleName, home: home, target: target}});
  }
};
