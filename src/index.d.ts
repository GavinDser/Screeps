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

    //wtf linked list
    linkList? : String[]
    
    //controller near source??
    controllerSource?: boolean

    //stateVariable
    stateSwitch?: boolean

    // container Id
    containerId?: string
}

interface PowerCreepMemory {
    role: string;
}

interface SpawnQueue {
    //queue: queueConstant[];
    constructor();
}

type queueConstant = {
    role: string;
    priority: number;
    bodyConstant: BodyPartConstant;
    name?: string;
    room: string;       
}