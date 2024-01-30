// 用于在键盘上操控角色

class Controller {
    constructor($canvas) {
        this.$canvas = $canvas;

        //我们会发现如果你按住某个键，输出时第一个字符会出现停顿，后续才是顺畅的
        //所以我们需要手动实现按住某个键的效果

        this.pressed_keys = new Set(); //set去重
        this.start();//记得初始化
    }

    start() {

        //在事件处理函数中，this的上下文会被改变，不再指向Controller实例。
        //通过使用outer，可以在事件处理函数内部引用Controller实例的属性和方法
        let outer = this;
        this.$canvas.on("keydown", function (event) {
            outer.pressed_keys.add(event.key);
        });
        this.$canvas.on("keyup", function (event) {
            outer.pressed_keys.delete(event.key);
        });
    }
}


export {
    Controller
}