
export const Body = {
    createAverageBody: function(energy:number):BodyPartConstant[]{
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
  
      return body;
    },
  
    createPercentageBody: function(percentageWork:number, energy:number):BodyPartConstant[]{
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
      return body;
    },
  
  
  
    createSoloBody: function(typeCreep:string, energy:number):BodyPartConstant[]{
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
      return body;
    }
  };
  