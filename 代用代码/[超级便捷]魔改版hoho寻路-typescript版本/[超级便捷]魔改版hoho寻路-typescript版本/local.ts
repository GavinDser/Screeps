import { RequestShard } from "@/shard/base"
import { closestPotalRoom, getOppositeDirection } from "@/utils"
/*
	魔改版hoho寻路，设计非常的淫性，即插即用 一句goTo走天下！
	使用本脚本可以获得如下buff加成：cpu大幅减少、头发掉落速度延缓、周边大佬亲切问候！
	具体使用方式见说明和压缩包中的图例
										-- superbitch 2021.10.29
*/
/* 寻路移动 */
export default class CreepLocalMove extends Creep {

    // 位置格式化
    public standardizePos(pos:RoomPosition):string|null{
        return `${pos.roomName}/${pos.x}/${pos.y}/${Game.shard.name}`
    }

    // 寻找不允许对穿的爬虫的位置
    public getStandedPos():RoomPosition[]
    {
        var standedCreep = this.room.find(FIND_MY_CREEPS,{filter:(creep)=>{
            return (creep.memory.standed == true || (creep.memory.crossLevel && this.memory.crossLevel && creep.memory.crossLevel > this.memory.crossLevel))
        }})
        if (standedCreep.length > 0)
        {
            var posList = []
            for (var i of standedCreep)
            {
                posList.push(i.pos)
            }
            return posList
        }
        return []
    }

    // 通用寻路
    public findPath(target:RoomPosition,range:number):string|null{
        /* 全局路线存储 */
        if (!global.routeCache) global.routeCache = {}
        if (!this.memory.moveData) this.memory.moveData = {}
        this.memory.moveData.index = 0
        /* 查找全局中是否已经有预定路线，如果有了就直接返回路线 */
        const routeKey = `${this.standardizePos(this.pos)} ${this.standardizePos(target)}`
        var route = global.routeCache[routeKey]
        if (route && this.room.name != target.roomName)
        {
            return route
        }
        /* 路线查找 */
        const result = PathFinder.search(this.pos,{pos:target,range:range},{
            plainCost:2,
            swampCost:10,
            maxOps:8000,
            roomCallback:roomName=>{
                // 在全局绕过房间列表的房间 false
                if (Memory.bypassRooms && Memory.bypassRooms.includes(roomName)) return false
                // 在爬虫记忆绕过房间列表的房间 false
                if (this.memory.bypassRooms && this.memory.bypassRooms.includes(roomName)) return false
                const room = Game.rooms[roomName]
                // 没有视野的房间只观察地形
                if (!room) return
                // 有视野的房间
                let costs = new PathFinder.CostMatrix
                // 将道路的cost设置为1，无法行走的建筑设置为255
                room.find(FIND_STRUCTURES).forEach(struct=>{
                    if (struct.structureType === STRUCTURE_ROAD)
                    {
                        costs.set(struct.pos.x,struct.pos.y,1)
                    }
                    else if (struct.structureType !== STRUCTURE_CONTAINER && 
                        (struct.structureType !==STRUCTURE_RAMPART || !struct.my))
                        costs.set(struct.pos.x,struct.pos.y,0xff)
                })
                room.find(FIND_MY_CONSTRUCTION_SITES).forEach(cons=>{
                    if (cons.structureType != 'road' && cons.structureType != 'rampart' && cons.structureType != 'container')
                    costs.set(cons.pos.x,cons.pos.y,255)
                })
                /* 防止撞到其他虫子造成堵虫 */
                room.find(FIND_HOSTILE_CREEPS).forEach(creep=>{
                    costs.set(creep.pos.x,creep.pos.y,255)
                })
                // 不支持对穿的位置
                const restrictedPos = room.getStandedPos()
                for (const rep of restrictedPos)
                {
                        costs.set(rep.x,rep.y,0xff)
                }
                return costs
                }
            })
        // 寻路异常返回null
        if (result.path.length <= 0) return null
        // 寻路结果压缩
        route = this.serializeFarPath(result.path)
        if (!result.incomplete) global.routeCache[routeKey] = route
        return route
    }

    // 使用寻路结果移动
    public goByPath():CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET{
        if (!this.memory.moveData) return ERR_NO_PATH
        const index = this.memory.moveData.index
        // 移动索引超过数组上限代表到达目的地
        if (index >= this.memory.moveData.path.length)
        {
            delete this.memory.moveData.path
            return OK
        }
        // 获取方向，进行移动
        const direction = <DirectionConstant>Number(this.memory.moveData.path[index])
        const goResult = this.go(direction)
        // 移动成功，更新下次移动索引
        if (goResult == OK) this.memory.moveData.index ++
        return goResult

    }

    // 通用移动 (配合findPath 和 goByPath)
    public goTo(target:RoomPosition,range:number = 1):CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_IN_RANGE | ERR_INVALID_TARGET{
        // var a = Game.cpu.getUsed()
        if (this.memory.moveData == undefined) this.memory.moveData = {}
        // 确认目标没有变化，如果变化了就重新规划路线
        const targetPosTag = this.standardizePos(target)
        if (targetPosTag !== this.memory.moveData.targetPos)
        {
            this.memory.moveData.targetPos = targetPosTag
            this.memory.moveData.path = this.findPath(target,range)
        }
        // 确认缓存有没有被清除
        if (!this.memory.moveData.path)
        {
            this.memory.moveData.path = this.findPath(target,range)
        }
        // 还为空的话就是没有找到路径
        if (!this.memory.moveData.path)
        {
            delete this.memory.moveData.path
            return OK
        }
        // 使用缓存进行移动
        const goResult = this.goByPath()
        // 如果发生撞停或者参数异常，说明缓存可能存在问题，移除缓存
        if (goResult === ERR_INVALID_TARGET){
            delete this.memory.moveData
        }
        else if (goResult != OK && goResult != ERR_TIRED)
        {
            this.say(`异常码：${goResult}`)
        }
        // var b = Game.cpu.getUsed()
        // this.say(`${b-a}`)
        return goResult
    }
    
    // 请求对穿 按照对穿等级划分 等级高的可以任意对穿等级低的，等级低的无法请求等级高的对穿，等级相等则不影响
    public requestCross(direction:DirectionConstant):OK | ERR_BUSY | ERR_NOT_FOUND{
        if (!this.memory.crossLevel) this.memory.crossLevel = 10    // 10为默认对穿等级
        // 获取目标方向一格的位置
        const fontPos = this.pos.directionToPos(direction)
        // 在出口、边界
        if (!fontPos) return ERR_NOT_FOUND
        const fontCreep = (fontPos.lookFor(LOOK_CREEPS)[0] || fontPos.lookFor(LOOK_POWER_CREEPS)[0]) as Creep | PowerCreep
        if (!fontCreep) return ERR_NOT_FOUND
        if (fontCreep.owner.username != this.owner.username) return
        this.say("👉")
        if (fontCreep.manageCross(getOppositeDirection(direction),this.memory.crossLevel)) this.move(direction)
        return OK
    }

    // 处理对穿
    public manageCross(direction:DirectionConstant,crossLevel:number):boolean{
        if (!this.memory.crossLevel) this.memory.crossLevel = 10
        if (!this.memory) return true
        if (this.memory.standed || this.memory.crossLevel > crossLevel){
            if (!(Game.time % 5)) this.say('👊')
            return false
        }
        // 同意对穿
        this.say('👌')
        this.move(direction)
        return true
    }

    // 单位移动 (goByPath中的移动基本函数)
    public go(direction: DirectionConstant): CreepMoveReturnCode | ERR_INVALID_TARGET{
        const moveResult = this.move(direction)
        if (moveResult != OK) return moveResult
        // 如果ok的话，有可能撞上东西了或者一切正常
        const currentPos = `${this.pos.x}/${this.pos.y}`
        if (this.memory.prePos && currentPos == this.memory.prePos)
        {
            // 这个时候确定在原点驻留了
            const crossResult = this.memory.disableCross ? ERR_BUSY : this.requestCross(direction)
            if (crossResult != OK)
            {
                delete this.memory.moveData
                return ERR_INVALID_TARGET
            }
        }
        this.memory.prePos = currentPos
        return OK
    }

    // 跨shard移动 这里不加了，粘连有点多，很难分离出来


    
}