/**
 * 这是 Duanyll 的移动优化模块, 包括了增强 CostMatrix 缓存和对穿功能
 *
 * 请查找 TODO 标记, 完成对本模块的配置
 *
 * 基本使用方法 (在主循环里面):
 *
 * ```js
 * const movement = require('这个文件')
 *
 * exports.loop = () => {
 *   movement.prepare();
 *
 *   ...你的逻辑...
 *
 *   movement.process();
 * }
 * ```
 *
 * 成功引入本模块后, 会像 Creep 和 PowerCreep 上添加 goTo 和 goToRoom 方法, 说明如下:
 *
 *
 * interface Creep | PowerCreep {
 *      * 获取、设置本 tick 内 creep 是否允许被对穿 (true 就不对穿)
 *     posLock: boolean,
 *      * 将 creep 移动到目标，使用精确寻路 (推荐本房间内移动时使用)
 *      * @param target 要去的目标
 *      * @param range 到达目标的范围
 *      * @returns 是否已经在目标范围内
 *     goTo(target: RoomPosition | { pos: RoomPosition }, range?: number): boolean;
 *      * 将 creep 移动到房间，使用模糊寻路 (推荐跨房间移动使用)
 *      * @param room 要去的房间
 *      * @returns 是否在目标房间内
 *     goToRoom(room: string): boolean;
 * }
 *
 * 举个例子:
 *
 * if (creep.goToRoom(creep.memory.room)) {
 *   let source = creep.room.find(FIND_SOURCE)[0];
 *   if (creep.goTo(source)) {
 *     creep.harvest(source);
 *   }
 * }
 *
 * 注意: 使用本模块后就不要用自带的 moveTo 方法了
 **/

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

let movingCreeps;
let moveInfo = {};
let exitInfo = {};
let creepPostionLock = {};
function prepareMovement() {
    movingCreeps = {};
    creepPostionLock = {};
}

var buildTime = "Sat Apr 10 2021 22:03:09 GMT+0800 (GMT+08:00)";

const cfg = {
    BUILD_TIME: buildTime,
    // TODO: 改成你的用户名!
    USER_NAME: "Rayboy",
    DEFAULT_PLAYER_WHITELIST: {
        "Rayboy": true
    },
    COSTMATRIX_UPDATE: 100,
    PATH_REUSE_HIGH: 15,
    PATH_REUSE_LOW:5
};

function getRoomType(name) {
    let xx = parseInt(name.substr(1), 10);
    let verticalPos = 2;
    if (xx >= 100) {
        verticalPos = 4;
    }
    else if (xx >= 10) {
        verticalPos = 3;
    }
    let yy = parseInt(name.substr(verticalPos + 1), 10);
    xx %= 10;
    yy %= 10;
    if (xx == 0 && yy == 0) {
        return "crossroad";
    }
    else if (xx == 0 || yy == 0) {
        return "highway";
    }
    else if ((xx >= 4 && xx <= 6) && (yy >= 4 && yy <= 6)) {
        return "sk";
    }
    else {
        return "normal";
    }
}

const offsetsByDirection = {
    [TOP]: [0, -1],
    [TOP_RIGHT]: [1, -1],
    [RIGHT]: [1, 0],
    [BOTTOM_RIGHT]: [1, 1],
    [BOTTOM]: [0, 1],
    [BOTTOM_LEFT]: [-1, 1],
    [LEFT]: [-1, 0],
    [TOP_LEFT]: [-1, -1]
};
const OPPOSITE_EXIT = {
    [FIND_EXIT_TOP]: FIND_EXIT_BOTTOM,
    [FIND_EXIT_BOTTOM]: FIND_EXIT_TOP,
    [FIND_EXIT_LEFT]: FIND_EXIT_RIGHT,
    [FIND_EXIT_RIGHT]: FIND_EXIT_LEFT
};

Memory.playerWhiteList || (Memory.playerWhiteList = {});
_.defaults(Memory.playerWhiteList, cfg.DEFAULT_PLAYER_WHITELIST);
function isHostile(username) {
    return username != cfg.USER_NAME && !Memory.playerWhiteList[username];
}

// TODO: 定制何时需要对穿, 请按需启用或自行编制规则
/** 寻路时是否考虑对穿这只 Creep */
function canBypassCreep(i, creep) {
    if (!creep.my)
        return false;
    // if (creep.memory.role == "manage")
    //     return false;
    // if (i.memory.role == creep.memory.role)
    //     return false;
    if (movingCreeps[creep.name])
        return true;
    if (creepPostionLock[creep.name])
        return false;
    return true;
}
/** 现在目标 Creep 就在面前, 是否需要对穿他 */
function shouldDoBypassCreep(i, creep) {
    if (creep.fatigue)
        return false;
    // if (!creep.my)
    //     return false;
    // if (creep.memory.role == "manage")
    //     return false;
    if (i.memory.role == creep.memory.role)
        return false;
    if (movingCreeps[creep.name] || creepPostionLock[creep.name])
        return false;
    return true;
}
function wrapPositionLockFunc(funcName) {
    const func = Creep.prototype[funcName];
    Creep.prototype[funcName] = function (...param) {
        let res = func.call(this, ...param);
        if (res == OK) {
            this.posLock = true;
        }
        return res;
    };
}

// TODO: Creep 进行这些动作时, 自动防止当前 Creep 被对穿
wrapPositionLockFunc("upgradeController");
wrapPositionLockFunc("harvest");
wrapPositionLockFunc("reserveController");
// wrapPositionLockFunc("build");
// wrapPositionLockFunc("repair");

function getObstacle(pos) {
    for (const s of pos.lookFor("structure")) {
        switch (s.structureType) {
            case "road":
            case "container":
                break;
            case "rampart":
                if (s.my || s.isPublic) {
                    break;
                }
                return s;
            default:
                return s;
        }
    }
    for (const s of pos.lookFor("constructionSite")) {
        if (!isHostile(s.owner.username)) {
            switch (s.structureType) {
                case "road":
                case "container":
                case "rampart":
                    break;
                default:
                    return s;
            }
        }
    }
    return pos.lookFor("creep")[0] || pos.lookFor("powerCreep")[0];
}
function moveBypass(creep, target) {
    function getTargetpos(pos, dir) {
        let x = pos.x + offsetsByDirection[dir][0];
        let y = pos.y + offsetsByDirection[dir][1];
        if (x < 0 || x > 49 || y < 0 || y > 49)
            return undefined;
        return new RoomPosition(x, y, pos.roomName);
    }
    let tarpos = getTargetpos(creep.pos, target);
    if (tarpos) {
        let obstacle = getObstacle(tarpos);
        if (obstacle instanceof Creep || obstacle instanceof PowerCreep) {
            if (shouldDoBypassCreep(creep, obstacle)) {
                obstacle.move(((target + 3) % 8 + 1));
            }
        }
        else if (obstacle) {
            return false;
        }
    }
    creep.move(target);
    return true;
}

class CostMatrixCache {
    constructor(roomName) {
        this.roomName = roomName;
        this.update();
    }
    static get(roomName, type) {
        var _a;
        (_a = this.cacheStore)[roomName] || (_a[roomName] = new CostMatrixCache(roomName));
        this.cacheStore[roomName].tryUpdate();
        return this.cacheStore[roomName][type];
    }
    static forceUpdate(roomName) {
        if (!this.cacheStore[roomName]) {
            this.cacheStore[roomName] = new CostMatrixCache(roomName);
        }
        else {
            this.cacheStore[roomName].update();
        }
    }
    tryUpdate() {
        if (this.updateTime + cfg.COSTMATRIX_UPDATE < Game.time
            || (Game.rooms[this.roomName] && !this.updateWithVisibility)) {
            this.update();
        }
    }
    update() {
        if (Game.rooms[this.roomName]) {
            this.updateStructure(Game.rooms[this.roomName]);
        }
        else {
            this.updateBlind(Game.map.getRoomTerrain(this.roomName));
        }
    }
    updateStructure(room) {
        this.updateTime = Game.time;
        this.updateBlind(room.getTerrain());
        this.updateWithVisibility = true;
        this.structure = this.terrain.clone();
        let maxHits = 0;
        let unwalkable = [];
        for (const s of room.find(FIND_STRUCTURES)) {
            switch (s.structureType) {
                case "road":
                    if (this.terrain.get(s.pos.x, s.pos.y) == 0xff || this.structure.get(s.pos.x, s.pos.y) != 0xff) {
                        this.structure.set(s.pos.x, s.pos.y, 1);
                    }
                    break;
                case "rampart":
                    if (isHostile(s.owner.username) || !s.my && !s.isPublic) {
                        this.structure.set(s.pos.x, s.pos.y, 0xff);
                    }
                    maxHits = Math.max(maxHits, s.hits);
                    unwalkable.push(s);
                    break;
                case "container":
                    break;
                default:
                    this.structure.set(s.pos.x, s.pos.y, 0xff);
                    maxHits = Math.max(maxHits, s.hits);
                    unwalkable.push(s);
                    break;
            }
        }
        for (const site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
            switch (site.structureType) {
                case "road":
                case "rampart":
                case "container":
                    break;
                default:
                    this.structure.set(site.pos.x, site.pos.y, 0xff);
            }
        }
        this.breakWall = new PathFinder.CostMatrix();
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                if (this.terrain.get(x, y) == 0xff) {
                    this.breakWall.set(x, y, 0xff);
                }
            }
        }
        for (const s of unwalkable) {
            this.breakWall.set(s.pos.x, s.pos.y, Math.max(0xff - 1, Math.min(1, this.breakWall.get(s.pos.x, s.pos.y) + _.floor(s.hits * 0xff / s.hitsMax))));
        }
    }
    updateBlind(terrain) {
        this.updateTime = Game.time;
        this.updateWithVisibility = false;
        if (this.wallOnly && this.terrain)
            return;
        this.wallOnly = new PathFinder.CostMatrix();
        this.terrain = new PathFinder.CostMatrix();
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                switch (terrain.get(x, y)) {
                    case TERRAIN_MASK_WALL:
                        this.wallOnly.set(x, y, 0xff);
                        this.terrain.set(x, y, 0xff);
                        break;
                    case 0:
                        this.wallOnly.set(x, y, 1);
                        this.terrain.set(x, y, 2);
                        break;
                    case TERRAIN_MASK_SWAMP:
                        this.wallOnly.set(x, y, 1);
                        this.terrain.set(x, y, 10);
                        break;
                }
            }
        }
        this.structure || (this.structure = this.terrain);
        this.breakWall || (this.breakWall = this.wallOnly);
    }
}
CostMatrixCache.cacheStore = {};

const blockedRoomMatrix = new PathFinder.CostMatrix();
for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
        blockedRoomMatrix.set(i, j, 0xff);
    }
}
Memory.roomsToAvoid || (Memory.roomsToAvoid = {});
Memory.roomCost || (Memory.roomCost = {});
function findPath(creep, opts, forceUpdate) {
    var _a;
    const sameRoom = opts && (!opts.crossRoom) && (creep.room.name == opts.pos.roomName);
    let cmModified = [];
    let path;
    try {
        path = PathFinder.search(creep.pos, { pos: opts.pos, range: (_a = opts.range) !== null && _a !== void 0 ? _a : 1 }, {
            roomCallback: (room) => {
                if (sameRoom && room != creep.pos.roomName)
                    return false;
                if (forceUpdate)
                    CostMatrixCache.forceUpdate(room);
                const matrix = CostMatrixCache.get(room, "structure");
                if (!matrix)
                    return false;
                if (Game.rooms[room]) {
                    const modInfo = { matrix, pos: [] };
                    cmModified.push(modInfo);
                    Game.rooms[room].find(FIND_CREEPS).forEach((c) => {
                        if (!canBypassCreep(creep, c)) {
                            modInfo.pos.push({ x: c.pos.x, y: c.pos.y, orig: matrix.get(c.pos.x, c.pos.y) });
                            matrix.set(c.pos.x, c.pos.y, 0xff);
                        }
                    });
                }
                return matrix;
            },
            plainCost: 2,
            swampCost: 10
        });
    }
    finally {
        cmModified.forEach(i => {
            i.pos.forEach(p => i.matrix.set(p.x, p.y, p.orig));
        });
    }
    return path;
}
function findRouteCallback(roomName) {
    var _a, _b;
    if (Memory.roomsToAvoid[roomName])
        return Infinity;
    if (Memory.roomCost[roomName])
        return Memory.roomCost[roomName];
    let type = getRoomType(roomName);
    let isMyRoom = (_b = (_a = Game.rooms[roomName]) === null || _a === void 0 ? void 0 : _a.controller) === null || _b === void 0 ? void 0 : _b.my;
    if (type == "highway" || type == "crossroad" || isMyRoom) {
        return 1;
    }
    else {
        return 1.5;
    }
}

function moveByPath(creep, path) {
    var _a;
    var idx = _.findIndex(path, (i) => i.isEqualTo(creep.pos));
    if (idx == -1) {
        if (!((_a = path[0]) === null || _a === void 0 ? void 0 : _a.isNearTo(creep.pos))) {
            return false;
        }
    }
    idx++;
    if (idx >= path.length) {
        return false;
    }
    return moveBypass(creep, creep.pos.getDirectionTo(path[idx]));
}
function goTo(creep, opts) {
    if(creep.memory.PositionInpresent !=undefined&&creep.memory.PositionInpresent.x==opts.pos.x&&creep.memory.PositionInpresent.y==opts.pos.y&&creep.memory.PositionInpresent.roomName==opts.pos.roomName)
    {
        creep.memory.StillStandTick ++;
    }
    else{creep.memory.StillStandTick=0;}
    if(creep.memory.StillStandTick>2)
    {
creep.moveTo(opts);
creep.memory.StillStandTick=0;
return;
    }
    creep.memory.PositionInpresent = opts.pos;
    const pathReuse = (creep.pos.inRangeTo(opts.pos, cfg.PATH_REUSE_LOW)) ? cfg.PATH_REUSE_LOW : cfg.PATH_REUSE_HIGH;
    if (creep.pos.isEqualTo(opts.pos)) {
        return;
    }
    if (creep.pos.isNearTo(opts.pos)) {
        moveBypass(creep, creep.pos.getDirectionTo(opts.pos));
        return;
    }
    if (!creep.moveInfo || !creep.moveInfo.opts.pos.isEqualTo(opts.pos) || creep.moveInfo.time + pathReuse < Game.time) {
        creep.moveInfo = {
            opts,
            time: Game.time,
            path: findPath(creep, opts).path
        };
    }
    if (!moveByPath(creep, creep.moveInfo.path) && creep.moveInfo.time != Game.time && Game.time & 1) {
        creep.moveInfo = {
            opts,
            time: Game.time,
            path: findPath(creep, opts, true).path
        };
        moveByPath(creep, creep.moveInfo.path);
    }
}
function goToRoom(creep, room) {
    function reFindPath() {
        let route = Game.map.findRoute(creep.room, room, {
            routeCallback: findRouteCallback
        });
        if (route == ERR_NO_PATH) {
            console.log(`${creep.name}: No path to ${room}!`);
            return false;
        }
        creep.exitInfo = { target: room, route };
        return true;
    }
    if (!creep.exitInfo || creep.exitInfo.target != room || !creep.exitInfo.route) {
        if (!reFindPath())
            return;
    }
    if (!creep.exitInfo.exitPos || creep.exitInfo.exitPos.roomName != creep.room.name) {
        if (creep.exitInfo.route == ERR_NO_PATH)
            return;
        let exit = creep.exitInfo.route.shift();
        let exits = Game.map.describeExits(creep.room.name);
        if (!exit || exit.room != exits[exit.exit]) {
            if (!reFindPath())
                return;
            exit = creep.exitInfo.route.shift();
        }
        creep.exitInfo.exitPos = creep.pos.findClosestByPath(exit.exit, {
            costCallback: (room) => {
                return CostMatrixCache.get(room, "structure");
            }
        });
        if (!creep.exitInfo.exitPos)
            return;
    }
    goTo(creep, { pos: creep.exitInfo.exitPos, range: 0 });
}

const movementCacheExtensions = {
    movement: {
        get: function () {
            return movingCreeps[this.name];
        },
        set: function (v) {
            if (!this.my)
                return;
            if ('room' in v && v.room == this.room.name)
                return;
            movingCreeps[this.name] = v;
        },
        enumerable: false,
        configurable: true
    },
    exitInfo: {
        get: function () {
            return exitInfo[this.name];
        },
        set: function (v) {
            exitInfo[this.name] = v;
        },
        enumerable: false,
        configurable: true
    },
    posLock: {
        get: function () {
            return creepPostionLock[this.name];
        },
        set: function (v) {
            creepPostionLock[this.name] = v;
        },
        enumerable: false,
        configurable: true
    },
    moveInfo: {
        get: function () {
            return moveInfo[this.name];
        },
        set: function (v) {
            moveInfo[this.name] = v;
        },
        enumerable: false,
        configurable: true
    }
};
Object.defineProperties(Creep.prototype, movementCacheExtensions);
Object.defineProperties(PowerCreep.prototype, movementCacheExtensions);
const movementExtensions = {
    goTo: {
        value: function (target, range = 1) {
            let pos = (target instanceof RoomPosition) ? target : target.pos;
            if (this.pos.inRangeTo(pos, range)) {
                return true;
            }
            else {
                this.movement = { pos, range };
                return false;
            }
        },
        configurable: true,
        enumerable: false
    },
    goToRoom: {
        value: function (room) {
            if (this.room.name == room) {
                return true;
            }
            else {
                this.movement = { room };
                return false;
            }
        },
        configurable: true,
        enumerable: false
    }
};
Object.defineProperties(Creep.prototype, movementExtensions);
Object.defineProperties(PowerCreep.prototype, movementExtensions);

function processMovement() {
    _.forIn(movingCreeps, (pos, name) => {
        const creep = Game.creeps[name] || Game.powerCreeps[name];
        if ('room' in pos) {
            goToRoom(creep, pos.room);
        }
        else {
            goTo(creep, pos);
        }
    });
}

exports.prepare = prepareMovement;
exports.process = processMovement;
//# sourceMappingURL=main.js.map
