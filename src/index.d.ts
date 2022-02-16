interface CreepMemory {
    //creep的角色1
    role: string;

    //creep要去的能量目标Id
    sourceId?: string;

    //source的本体
    source?: Extract<AnyStructure, StructureExtension | StructureTower |StructureStorage>;
 
    //Creep要去的房间
    targetRoom?: string;

    //Creep自己的房间
    homeRoom?: string;

    //Creep的目标建筑物或者是对象
    target?: AnyStructure;

    //Creep的boolean，用于转换状态
    working?:boolean

    //对穿状态
    dontPullMe? : boolean

    //行走房间路线:
    path? : string[]

    linkId?: string;
    
    //controller near source??
    controllerSource?: boolean

    //stateVariable
    stateSwitch?: boolean

    // container Id
    containerId?: string

    //position to go to (for center creeps)
    position?: number[]
}

interface PowerCreepMemory {
    role: string;
}

interface Memory {
    // for stats
    stats: {
        gcl?: number
        gclLevel?: number
        gpl?: number
        gplLevel?: number
        cpu?: number
        bucket?: number
    }
}

interface RoomMemory {
    transportQueue;
}

interface MoveToOpts {
    ignoreSwamps?: boolean
}

//任务系统

type Task = {
    
}