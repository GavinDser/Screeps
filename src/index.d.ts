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



}