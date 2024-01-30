//每名角色都有自己的动画
//但是基本逻辑都是一样的，所以可以继承自player基类
//这里仅实现草薙京

import { Player } from '/static/js/player/player.js';
import { GIF } from '/static/js/utils/gif.js';

class Kyo extends Player {
    constructor(root, info) {
        super(root, info);

        this.init_animations();
    }

    //初始化动画数组
    init_animations() {
        let outer = this;  //只要涉及到函数调用this就一定先要保存当前实例
        let offsets = [0, -22, -22, -180, 0, 0, 0];    //只有走动时需要加y轴偏移量且向上  -22是多次实验值
        for (let i = 0; i < 7; i++) {  //对应状态机
            let gif = GIF();
            gif.load(`/static/images/player/kyo/${i}.gif`);
            this.animations.set(i, {
                gif: gif,
                frame_cnt: 0,  //总帧数
                frame_rate: 10,  //帧率，即每x帧后渲染下一次    这个值每个电脑、每个浏览器的适应值不一样
                offset_y: offsets[i],  //y轴偏移量
                loaded: false,  //是否加载完成
                scale: 2,    //缩放倍数
            });

            gif.onload = function () {   //gif输入函数
                let obj = outer.animations.get(i);   //obj取出了outer实例的第i张gif
                obj.frame_cnt = gif.frames.length;   //在GIF类中实现的计算帧数
                obj.loaded = true;

                if (i === 3) {
                    obj.frame_rate = 5;
                }
            }
        }
    }
}
export {
    Kyo
};