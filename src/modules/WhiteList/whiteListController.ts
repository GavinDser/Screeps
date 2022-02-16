export class WhiteListController {
    private whiteList: string[];
    public constructor(){
        this.whiteList = ['hi']
    }
    public addName(){
        return this.whiteList;
    }

    public renewAddName(){
        if (!global.WLaddName){
            global.WLaddnName = function(){this.addName()}
        }
    }

    
}