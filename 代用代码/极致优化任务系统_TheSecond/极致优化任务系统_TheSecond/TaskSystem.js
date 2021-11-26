


//使用方法：新建一个任务后添加到组内，AddTaskToGroup添加任务到任务组，通过GetTaskOfGroup(Group)获取优先级最高的任务,想更改任务优先级可以使用ReSorctAfterGetTwoForkedTreeFirst(Group,Task,Weight)
//作者没用过 根据之前写的任务系统写的 有Bug上报

var TaskSystem = 
{
    //新建一个任务 任务名 权重 任务相关Object 任务类型 (通过GetType(Num)获取 Num对应TaskType) 是否可以被替换(当组内有优先级比此任务高的替换) 任务所执行的方法
    CreateATask(TaskName,Weight,TaskObj,TaskType,IsCanRePlaceTask,QuestDoing)
    {
var Task = new Object();
//任务名
Task.Name = TaskName;
//任务权重
Task.Weight = Weight;
//任务相关Object
Task.Obj = TaskObj;
//任务类型
Task.Type = TaskType;
Task.IsCanRePlaceTask=IsCanRePlaceTask;
Task.QuestDoing = QuestDoing;
    }
    //获得任务枚举类型
    ,GetType(Num)
    {
        TaskType.forEach(element => {
            if(Enum.GetValues(typeof(element))==Num)
            {
           return element;
            }
        });
    },
    //执行任务
    QuestDoing(Task,TaskObj)
    {
    Task.QuestDoing(TaskObj);
    },
    //添加一个任务到组内
    AddTaskToGroup(Group,Task)
    {
    AddToTwoForkedTree(Group,Task);
    }
    //获得组内优先级最高的任务
    ,GetTaskOfGroup(Group)
    {
        if(Group.length>0){
        let GetTask = Group[0];
        Group.splice(0,1);
        if(Group.length>0){
        ReSorctAfterGetTwoForkedTreeFirst(Group,0);
        }
        return GetTask;
        }
      return 
    },
    //刷新任务优先级后重排序
    ReSorctAfterGetTwoForkedTreeFirst(Group,Task,Weight)
    {
        ReSorctAfterChangeTaskWeight(Group,Task,Weight);
    }
}
function ReSorctAfterGetTwoForkedTreeFirst(Group,Index)
{
    for (let i = 0; i < 2; i++) {
        let IndexOfSon = (Index * 2 + 1) - 1 + i;
        if (IndexOfSon >= Group.length) { break; }
        if (Group[Index].Weight < Group[IndexOfSon].Weight) {
            let exchange = Group[Index];
            Group[Index] = Group[IndexOfSon];
            Group[IndexOfSon] = exchange;
            ReSorctAfterGetTwoForkedTreeFirst(Group, IndexOfSon);
            break;
        }
    }
}
function ReSorctAfterChangeTaskWeight(Group,Task,Weight)
{
    Task.Weight = Weight;
for (let i = 0; i < Group.length; i++) {
    if(Group[i].Name==Task.Name)
    {
        TwoForkedTreeSort(Group,i);
    }   
}
}
function AddToTwoForkedTree(Group, ToAddObj) {
    var Index = Group.length;
    Group[Group.length] = ToAddObj;
    TwoForkedTreeSort(Group, Index);
}
function TwoForkedTreeSort(Group, Index) {
    if (Index == 0) { return; }
    var Parent = parseInt(Index / 2 - 1);
    if (Group[Parent] == undefined || Group[Index].Weight > Group[Parent].Weight) {
        var exchange = Group[Parent];
        Group[Parent] = Group[Index]
        Group[Index] = exchange;
        Index = Parent;
        TwoForkedTreeSort(Group, Index);
    }
    else { return; }

}
const TaskType = 
{
    TaskType_Delivr:1,
    TaskType_Work:2
}


module.exports = TaskSystem;