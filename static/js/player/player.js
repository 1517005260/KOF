import { GameObject } from '/static/js/game_object/base.js';

class Player extends GameObject {
    constructor(root, info) {
        super();

        this.root = root;
        //唯一id
        this.id = info.id;
        //坐标和大小
        this.x = info.x;
        this.y = info.y;
        this.width = info.width;
        this.height = info.height;

        this.color = info.color;

        this.direction = 1;//正向1，反向-1

        //速度
        this.vx = 0;
        this.vy = 0;
        this.speedx = 400;//水平运动初速度
        this.speedy = -1000;//竖直运动(跳起)初速度，注意是负的（y轴竖直向下）

        this.g = 50;//重力加速度

        this.ctx = this.root.game_map.ctx;
        this.pressed_keys = this.root.game_map.controller.pressed_keys;

        //状态机
        this.status = 3;// 0=原地不动 1=向前走 (2=向后,逻辑和1一样) 3=跳 4=攻击 5=受击 6=死亡
        //初始3是因为刷新后人物是落下来的

        //为了方便，将所有动作存储到一个数组里
        this.animations = new Map();
        //当前记录了多少帧
        this.frame_current_cnt = 0;
    }

    start() {

    }

    update_move() {
        if (this.status === 3)  //只有在空中时再计算重力
            this.vy += this.g; //v=v0+gt

        this.x += this.vx * this.timedelta / 1000;
        //timedelta是继承自GameObject的自定义变量。时间单位是毫秒，要除1000统一到秒
        this.y += this.vy * this.timedelta / 1000;

        //这么做完之后会发现人物会掉出屏幕，所以我们要增加边界的概念
        if (this.y > 450) {
            this.y = 450;
            this.vy = 0;
            if (this.status === 3)
                this.status = 0;//跳到地上静止了
        }
        if (this.x < 0)
            this.x = 0;
        else if (this.x + this.width > this.root.game_map.$canvas.width())
            this.x = this.root.game_map.$canvas.width() - this.width;
    }

    update_control() {
        let w, a, d, space;//经典方向键和攻击键，没有实现下蹲所以无s
        if (this.id === 0) {  //玩家1
            w = this.pressed_keys.has('w');
            a = this.pressed_keys.has('a');
            d = this.pressed_keys.has('d');
            space = this.pressed_keys.has(' ');
        } else {  //玩家2
            w = this.pressed_keys.has('ArrowUp');
            a = this.pressed_keys.has('ArrowLeft');
            d = this.pressed_keys.has('ArrowRight');
            space = this.pressed_keys.has('Enter');
        }

        //简陋的实现：在空中不能动，因为没有相关动画实现
        if (this.status === 0 || this.status === 1)  //如果不动或者在走路时才能有下一步
        {
            if (space) {  //攻击状态
                this.status = 4;  //这会修改默认状态，在render中有特判
                this.vx = 0;
                this.frame_current_cnt = 0; //攻击时从第0帧开始渲染
            }
            else if (w) {   //垂直跳、向前45度跳、向后45度跳
                if (d) {
                    this.vx = this.speedx;
                } else if (a) {
                    this.vx = -this.speedx;
                } else {
                    this.vx = 0;
                }
                this.vy = this.speedy;
                this.status = 3; //更新状态 
                this.frame_current_cnt = 0;
            }//如果没跳
            else if (d) {
                this.vx = this.speedx;
                this.status = 1;
            } else if (a) {
                this.vx = -this.speedx;
                this.status = 1;
            } else {
                this.vx = 0;
                this.status = 0;
            }
        }
    }

    update_direction() {  //更新朝向
        let players = this.root.players;
        if (players[0] && players[1]) {     //如果两名玩家都存在
            let me = this;
            let you = players[1 - this.id];  //显然两名玩家的id和是1
            if (me.x < you.x)//如果me在you的左边，则me朝右，you朝左
                me.direction = 1;
            else
                me.direction = -1;
        }
    }

    update() {
        this.update_control();
        this.update_move();
        this.update_direction();

        this.render();//渲染一定要等所有动作做完了再渲染
    }

    render() {
        //用抽象几何图形代替人物，例如矩形，用于判定碰撞
        //后期替换成角色贴图或动画即可
        //渲染成矩形，参数通过root索引
        // this.ctx.fillStyle = this.color;
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);

        //用gif渲染
        let status = this.status;

        //特判是前进还是后退
        if (this.status === 1 && this.direction * this.vx < 0)
            status = 2;//走路状态且方向和速度反向
        //注意改的是status,否则会2会变成默认状态，人物会一直后退

        let obj = this.animations.get(status);
        if (obj && obj.loaded) {
            if (this.direction > 0) {
                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;  //循环播放某一帧
                let image = obj.gif.frames[k].image;  //获取当前帧
                this.ctx.drawImage(image, this.x, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);  //canvas用法：左上角->右下角渲染
                //y轴偏移量：不加的话会发现走动时图片位置会下降
            } else {
                //反向图片需要水平翻转
                //方法：调整坐标系
                this.ctx.save(); //先保存配置
                this.ctx.scale(-1, 1);//x轴乘上-1，y不变，即水平反转

                //但是我们会发现此时图片落在了x轴的负半轴，所以坐标系还要平移
                this.ctx.translate(-this.root.game_map.$canvas.width(), 0); //向右边（负方向）平移

                let k = parseInt(this.frame_current_cnt / obj.frame_rate) % obj.frame_cnt;
                let image = obj.gif.frames[k].image;
                //渲染的时候，由于反转+平移了坐标系，现在是由右上角向左下角的渲染
                //因此，我们需要水平反转渲染
                //此外还要注意，由于现在是右上角开始渲染，我们如果用减法反转到中轴线对面的左上角，还需要加上偏移量（人物宽度）
                this.ctx.drawImage(image, this.root.game_map.$canvas.width() - this.x - this.width, this.y + obj.offset_y, image.width * obj.scale, image.height * obj.scale);

                this.ctx.restore();  //恢复配置,把反转的坐标系再翻回来
            }

            this.frame_current_cnt++;   //显示完这一帧后帧数++

            //特判攻击状态
            if (status === 4 && this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) {
                this.status = 0;//攻击状态播放完后回到默认状态
            }
        }
    }
}


export {
    Player
}