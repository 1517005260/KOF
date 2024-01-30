//这是我们所有游戏对象的基类
//为了能每秒刷新对象，我们需要将对象的所有实例都存下来
//定义全局数组存储所有对象实例
let GAME_OBJECTS = [];

class GameObject {
    constructor() { //类构造函数
        //每一个实例都要存下来
        GAME_OBJECTS.push(this);

        this.timedelta = 0;  //当前这帧距离上帧的时间间隔
        this.has_call_start = false; //是否已经执行过start初始化

    }
    //初始化，仅一次
    start() {

    }
    //除第一帧外每帧执行
    update() {

    }
    //从GAME_OBJECTS中删除当前对象实例
    destory() {
        for (let i in GAME_OBJECTS) {   //for in 遍历键值对，js中的数组相当于key为序号的字典。所以此处相当于遍历下标
            if (GAME_OBJECTS[i] === this) {
                GAME_OBJECTS.splice(i, 1);  //函数splice(a, b)：删除从a开始的b个元素
                break;
            }
        }
    }
}

//接下来做动画主要依靠requestAnimationFrame这个函数
let last_timestamp = 0; //上一帧的发生时间

let GAME_OBJECTS_FRAME = function (now_timestamp) {  //传入这一帧发生的时间
    for (let obj of GAME_OBJECTS)   //遍历value
    {
        if (obj.has_call_start === false) {
            obj.start();
            obj.has_call_start = true;
        } else {
            obj.update();
            obj.timedelta = now_timestamp - last_timestamp;
        }
    }
    last_timestamp = now_timestamp;
    requestAnimationFrame(GAME_OBJECTS_FRAME);  //递归调用
}

requestAnimationFrame(GAME_OBJECTS_FRAME);  //启动！

export {
    GameObject
}