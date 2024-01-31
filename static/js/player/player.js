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

        this.hp = 100;  //血条
        this.$hp_outer = this.root.$kof.find(`.kof-head-hp${this.id}>div`);//取出血条便于控制 
        this.$hp_inner = this.$hp_outer.find('div');
    }

    start() {

    }

    update_move() {
        this.vy += this.g; //施加重力场

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
                this.frame_current_cnt = 0; //攻击时从第0帧开始渲染，完整播放整个动画并结束
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
        if (this.status === 6) return;  //防止死亡后还会转向

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

    is_attacked() {
        if (this.status === 6) return;  //防止死亡后受击

        this.status = 5;//这也会改变默认状态，在render中要特判回归默认状态
        this.frame_current_cnt = 0;

        this.hp = Math.max(this.hp - 20, 0);

        // this.$hp.width(this.$hp.parent().width() * this.hp / 100);
        //用动画效果实现
        //拖影效果：绿色先变，红色后变
        this.$hp_inner.animate({
            width: this.$hp_outer.parent().width() * this.hp / 100
        }, 300); //300ms渐变
        this.$hp_outer.animate({
            width: this.$hp_outer.parent().width() * this.hp / 100
        }, 600);

        if (this.hp <= 0) {
            this.status = 6;
            this.frame_current_cnt = 0;
            this.vx = 0;//防止死时受击滑动
        }
    }

    is_collision(r1, r2) {  //碰撞检测
        //原理：两个矩形有交集，就是在两个一维的线段层次上，两者有交集
        /*ex:
            线段1== a------b
            线段2==     c-------d
            有交集== max(a,c)<=min(b,d)    
        */
        //分水平和竖直两个层次：
        if (Math.max(r1.x1, r2.x1) > Math.min(r1.x2, r2.x2))
            return false;
        if (Math.max(r1.y1, r2.y1) > Math.min(r1.y2, r2.y2))
            return false;
        return true;
    }

    update_attack() {  //更新判定攻击的抽象几何块
        if (this.status === 4 && this.frame_current_cnt === 18) {   //18帧是实验值，基本上攻击动作在16-20帧进行，我们取中间判定
            let me = this;
            let you = this.root.players[1 - this.id];

            let r1;     //手臂区域,用坐标表示
            if (this.direction > 0) {
                r1 = {
                    x1: me.x + 120,
                    y1: me.y + 40,
                    x2: me.x + 120 + 100,
                    y2: me.y + 40 + 20
                };
            } else {
                r1 = {
                    x1: me.x + me.width - 120 - 100,
                    y1: me.y + 40,
                    x2: me.x + me.width - 120,
                    y2: me.y + 40 + 20
                };
            }

            let r2 = {  //对方区域
                x1: you.x,
                x2: you.x + you.width,
                y1: you.y,
                y2: you.y + you.height
            };

            if (this.is_collision(r1, r2))  //成功碰撞，对方受击
            {
                you.is_attacked();
            }
        }
    }

    update() {
        this.update_control();
        this.update_move();
        this.update_direction();
        this.update_attack();

        this.render();//渲染一定要等所有动作做完了再渲染
    }

    render() {
        //用抽象几何图形代替人物，例如矩形，用于判定碰撞
        //后期替换成角色贴图或动画即可
        //渲染成矩形，参数通过root索引
        // this.ctx.fillStyle = this.color;
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);

        // //实现攻击：碰撞检测  -> 使用矩形代替人物，手臂
        // this.ctx.fillStyle = "blue";  // 人
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);
        // if (this.direction > 0) {     //手臂
        //     this.ctx.fillStyle = "red";
        //     this.ctx.fillRect(this.x + 120, this.y + 40, 100, 20);   //实验值
        // } else {
        //     this.ctx.fillStyle = "red";
        //     this.ctx.fillRect(this.x + this.width - 120 - 100, this.y + 40, 100, 20);   //对称方法同人物反转
        //     //即：先把左上角+width转移到右上角，再渲染
        // }


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

            //特判攻击状态
            if (status === 4 || this.status === 5 || this.status === 6) {
                if (this.frame_current_cnt === obj.frame_rate * (obj.frame_cnt - 1)) //写一起太长了，分开写
                    if (this.status !== 6)
                        this.status = 0;//回到默认状态
                    else {
                        //角色死亡后应该一直倒地不起
                        this.frame_current_cnt--;//回到倒数第二帧，后面再++，即停在最后一帧
                    }
            }
        }
        this.frame_current_cnt++;   //显示完这一帧后帧数++，准备渲染下一帧
    }
}


export {
    Player
}