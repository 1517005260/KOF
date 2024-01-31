//地图对象

import { GameObject } from '/static/js/game_object/base.js';
import { Controller } from '/static/js/controller/base.js';

class GameMap extends GameObject {  //由基类继承
    constructor(root) {   //root即主类KOF
        //继承时一定要先super，执行基类的构造函数
        super();
        this.root = root;
        //定义canvas
        this.$canvas = $('<canvas width="1280" height="720" tabindex=0 ></canvas>');  //tabindex用于canvas可聚焦（可以接收键盘的信号）
        //取出canvas，索引[0]可供访问<canvas>元素本身，getcontext可供初始化2d作图
        this.ctx = this.$canvas[0].getContext("2d");  //最后结果保存在ctx中
        this.root.$kof.append(this.$canvas);  //将创建的 canvas 元素添加到 root 对象的 $kof 属性中
        this.$canvas.focus();

        this.controller = new Controller(this.$canvas);

        this.$timer = this.root.$kof.find(".kof-head>.kof-head-timer");
        this.time_left = 60000  // ms
    }

    start() {

    }

    update() {
        this.time_left -= this.timedelta;
        if (this.time_left <= 0) this.time_left = 0;
        this.$timer.text(parseInt(this.time_left / 1000));

        //平局机制
        if (this.time_left === 0) {
            let [a, b] = this.root.players;
            if (a.status !== 6 && b.status !== 6) {
                a.status = b.status = 6;
                a.frame_current_cnt = b.frame_current_cnt = 0;
                a.vx = b.vx = 0;
            }
        }

        if (this.time_left > 0) {
            let [a, b] = this.root.players;
            if (a.status === 6 && b.status !== 6 || a.status !== 6 && b.status === 6) {
                this.time_left = 0;
            }
        }

        this.render();  //避免屎山，封装代码
    }
    //每一帧都要清空地图，否则看到的就不是物体在运动，而是带着轨迹在拉长
    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);  //参数x, y, width, height (左上角，右下角)  ***注意坐标系x轴水平向左，y轴竖直向下
    }
}


export {
    GameMap
}