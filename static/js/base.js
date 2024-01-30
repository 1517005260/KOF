// 核心：面向对象的写法

//这个是我们的主类

import { GameMap } from '/static/js/game_map/base.js';
import { Kyo } from '/static/js/player/kyo.js';

class KOF {
    constructor(id) {
        this.$kof = $('#' + id); //jquery选择器，选择了:#kof

        this.game_map = new GameMap(this);

        this.players = [  //两个玩家
            new Kyo(this, {
                id: 0,
                x: 200,
                y: 0,
                width: 120,
                height: 200,
                color: 'blue',  //调试用，渲染成蓝色矩形
            }),
            new Kyo(this, {
                id: 1,
                x: 900,
                y: 0,
                width: 120,
                height: 200,
                color: 'red',
            })
        ];
    }
}

export {
    KOF
}