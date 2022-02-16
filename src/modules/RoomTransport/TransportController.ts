export class TransportController {
    constructor (roomList: string[]){
        for (let room of roomList){
            if(Game.rooms[room].memory.transportQueue == undefined){
                Game.rooms[room].memory.transportQueue = [];
            }
        }
    }
}