const St = imports.gi.St;
const {GLib, Clutter, Gio} =  imports.gi;
const Main = imports.ui.main;
//const Tweener = imports.ui.tweener;
//const ByteArray = imports.byteArray;

let text, button, path_temp, path_cpu_info, lastActive, lastTotal;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}
//function _showHello(){
//    text.set_text("Hello,world!"+temp+"\u2103"+";"+parseInt(util)+"%");
//    text.opacity = 255;

//    let monitor = Main.layoutManager.primaryMonitor;

//    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
//                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

//    Tweener.addTween(text,
//                     { opacity: 0,
//                       time: 2,
//                       transition: 'easeOutQuad',
//                       onComplete: _hideHello });
    
//}
function _getData() {
    let [type, cpu_data, etag] = path_cpu_info.load_contents(null);
    let [, temp, ] = path_temp.load_contents(null);

    //const cpuInfo = ByteArray.toString(cpu_data).split('\n').shift().trim().split(/[\s]+/).map(n => parseInt(n, 10));
    //const cpuInfoTemp = cpu_data.split('\n').shift().trim().split(' ').map(n => n.trim());
    //let re = null;
    //re = /[\s]+/g;
    //re = new RegExp("[\s]+", "g");
//    var i = 3;
//    var txt = "";
    const cpu_info_tmp = cpu_data.toString().split(/[\s]+/g).map(n => parseInt(n, 10));
    const cpu_info = cpu_info_tmp.slice(11, 22);  // (11, 22)
//    while( i > 0){
//        txt = txt + cpu_info[i-1] + ",";
//        i -= 1;
//    };
//    cpuInfoTemp.shift();  // delete first header label.("cpu").
//    const cpuInfo = cpuInfoTemp.map(n => parseInt(n, 10));
    const [,
        user,
        nice,
        system,
        idle,
        iowait,
        irq, // eslint-disable-line
        softirq,
        steal,
        guest, // eslint-disable-line
        ] = cpu_info;
    const active = user + system + nice + softirq + steal;
    const total = user + system + nice + softirq + steal + idle + iowait;  
    
    var util = 100 * ((active - lastActive) / (total - lastTotal));
	
    lastActive = active;
    lastTotal = total;

    temp = parseInt(temp, 10) / 1000;
    text.set_text(parseInt(util)+"%  "+temp+"\u2103");
//    text.set_text(cpu_info[0]);
    timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, ()=>{_getData()});      
}

function init() {
}

function enable() {
    //path_cpu_info = Gio.File.new_for_path('/proc/swaps');
    path_cpu_info = Gio.File.new_for_path('/proc/stat');
    path_temp = Gio.File.new_for_path('/sys/class/thermal/thermal_zone1/temp');
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
//    let icon = new St.Icon({ icon_name: 'system-run-symbolic',
//                             style_class: 'system-status-icon' });

//    button.set_child(icon);
//    button.connect('button-press-event', _showHello);
    if (!text) {
        //text = new St.Label({ style_class: 'helloworld-label', text: parseInt(util)+"%"+" "+temp+"\u2103" });
        text = new St.Label({ 
            style_class: 'helloworld-label', 
            text: "------",
            y_align: Clutter.ActorAlign.CENTER,
        });
        //Main.uiGroup.add_actor(text);
    }
    button.set_child(text);
    _getData();
    button.connect('button-press-event', _getData);
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    GLib.source_remove(timeout);
    Main.panel._rightBox.remove_child(button);
    //Main.uiGroup.remove_actor(text);
}
