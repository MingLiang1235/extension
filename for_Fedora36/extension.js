/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
//
// Sample extension code, makes clicking on the panel show a message
//
/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Clutter, GLib, Gio } = imports.gi;
//const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const ByteArray = imports.byteArray;

/*const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;*/

const ExtensionUtils = imports.misc.extensionUtils;
//const _ = ExtensionUtils.gettext;

let panelButton,
panelButtonText,
lastActive,
lastTotal,
path_cpu_info,
path_fan,
path_temp;

//const Indicator = GObject.registerClass(
//class Indicator extends PanelMenu.Button {
    //_init(){
        //super._init(0.0, _("My Indicator of fan and cpu"));
        //this.add_child(new St.Icon({
            //icon_name: 'system-run-symbolic',
            //style_class: 'system-status-icon',
        //}));

        //let item = new PopupMenu.PopupMenuItem(_('Show cpu and fan variable.'));
        //item.connect('activate', () => {
            //Main.notify(_('The Cpu and Fan speed is:'));
        //});
        //this.menu.addMenuItem(item);
    //}
//});

function getdata(){
	let [type1 , cpu_data] = path_cpu_info.load_contents(null);
	//let temp = path_temp.load_contents(null);
	let [, fan_data, etag ] = path_fan.load_contents(null);
	let [, temp, ] = path_temp.load_contents(null);
	
	//cpu_temp = cat /sys/class/thermal/thermal_zone1/temp|awk '{printf("CPU Temp: %.2f\t",$1/1000)}'
	const cpuInfo = ByteArray.toString(cpu_data).split('\n').shift().trim().split(/[\s]+/).map(n => parseInt(n, 10));
	const fanInfo = ByteArray.toString(fan_data).split('\n');
	const [, // eslint-disable-line
		user,
		nice,
		system,
		idle,
		iowait,
		irq, // eslint-disable-line
		softirq,
		steal,
		guest, // eslint-disable-line
	    ] = cpuInfo;
	let speed_line = fanInfo[1].split(/[\s]+/);  // faninfo[1] is the speed:  mmmm line.
	const speed = parseInt(speed_line[1], 10);
	temp = parseInt(temp, 10) / 1000;
		
	const active = user + system + nice + softirq + steal;
	const total = user + system + nice + softirq + steal + idle + iowait;

	utilization = 100 * ((active - lastActive) / (total - lastTotal));
	
	lastActive = active;
	lastTotal = total;
	
	panelButtonText.set_text(parseInt(utilization)+"%"+" "+temp+"\u2103"+" "+speed+"perMin");
	timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, ()=>{getdata()});
}
/*function _showALOHA(){
    let text = new St.Label({ style_class: 'alohaworld-label', text: "Aloha world!"});
    let monitor = global.get_primary_monitor();
    global.stage.add_actor(text);
    text.set_position(Math.floor(monitor.width / 2 - text.width / 2),Math.floor(monitor.height / 2 - text.height / 2));
   Mainloop.timeout_add(5000, function () { text.destroy();}); 
}*/

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
		
		path_cpu_info = Gio.File.new_for_path('/proc/stat');
		path_fan = Gio.File.new_for_path('/proc/acpi/ibm/fan');
		path_temp = Gio.File.new_for_path('/sys/class/thermal/thermal_zone1/temp');
		
		panelButton = new St.Bin({
		style_class : "cpu-dots",
		});
		
		panelButtonText = new St.Label({
		text : "--",
		y_align: Clutter.ActorAlign.CENTER,
		});
		
		panelButton.set_child(panelButtonText);
		getdata();
		Main.panel._rightBox.insert_child_at_index(panelButton, 0);
/*      this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);*/
    
/*    	Main.panel.actor.reactive = true;
	    Main.panel.actor.connect('button-release-event', _showALOHA);*/
    }

    disable() {
        /*this._indicator.destroy();
        this._indicator = null;*/
        GLib.source_remove(timeout);
		Main.panel._rightBox.remove_child(panelButton);
		panelButtonText?.destroy();
		panelButtonText = null;
		panelButton?.destroy();
		panelButton = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
