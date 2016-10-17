var list = $("#nav li");

//行的频率数，不能小于16
var size = 64;


var canvasCont = $("#canvasCont")[0];
var height, width;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvasCont.appendChild(canvas);
var Dots = [];
var line;

var mv = new MusicVisualizer({
	size: size,
	visualizer: draw, //传递画图方法
	drawProcess: drawProcessor
})

//js模仿jquery，获取dom节点
function $(s) {
	return document.querySelectorAll(s);
}


for (var i = 0; i < list.length; i++) {
	list[i].onclick = function() {
		for (var j = 0; j < list.length; j++) {
			list[j].className = "";
		}
		this.className = "selected";
		mv.play("/media/" + this.title);
	}
}


function random(m, n) {
	//返回 n-m 之间的整数
	return Math.round(Math.random() * (n - m) + m)
}

function getDots() {
	Dots = [];
	for (var i = 0; i < size; i++) {
		var x = random(0, width);
		var y = random(0, height);
		var color = "rgba(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ",0)";
		Dots.push({
			x: x,
			y: y,
			dx: random(0, 2),
			color: color,
			cap: 0
		})
	}
}


function resize() {
	height = canvasCont.clientHeight;
	width = canvasCont.clientWidth;
	canvas.height = height;
	canvas.width = width;
	//定义填充渐变色
	line = ctx.createLinearGradient(0, 0, 0, height);
	line.addColorStop(0, "red");
	line.addColorStop(0.5, "yellow");
	line.addColorStop(1, "green");
	ctx.fillStyle = line;
	getDots();
}
resize();
//窗口改变大小时，调用
window.onresize = resize;

function draw(arr) {
	ctx.clearRect(0, 0, width, height);
	var w = width / size;
	var cw = w * 0.6;
	var capH = cw > 10 ? 10 : cw;
	ctx.fillStyle = line;
	for (var i = 0; i < size; i++) {
		if (draw.type == "column") {
			var o = Dots[i];
			var h = arr[i] / 256 * height;
			//绘制矩形
			ctx.fillRect(w * i, height - h, cw, h);
			//绘制小帽
			ctx.fillRect(w * i, height - (o.cap + capH), cw, capH);
			o.cap--;
			if (o.cap < 0) {
				o.cap = 0;
			}
			if (o.cap < h + 20 && h > 0) {
				o.cap = h + 20 > height - capH ? height - capH : h + 20;
			}
		} else if (draw.type == "dot") {
			ctx.beginPath();
			var o = Dots[i];
			var r = 10 + arr[i] / 256 * (height > width ? width : height) / 10;
			ctx.arc(o.x, o.y, r, 0, Math.PI * 2, true);
			var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
			g.addColorStop(0, "#fff");
			g.addColorStop(1, o.color);
			ctx.fillStyle = g;
			ctx.fill();
			o.x += o.dx;
			o.x = o.x > width ? 0 : o.x;
			// 设置线条样式
			//ctx.strokeStyle = "#fff";
			//ctx.stroke();
		}
	}
}

function drawProcessor(total_time) {
	// 一次循环60ms占歌曲总长度的百分比
	$("#finished")[0].style.width = parseFloat($("#finished")[0].style.width) + 300 * 60 / (total_time * 1000) + 'px';
}

// 默认柱状图
draw.type = "column";


$("#Volume")[0].onmousedown = function() {
	this.onmousemove = function() {
		mv.changeVolumn(this.value / this.max);
	}
	this.onmouseup = function() {
		this.onmousemove = false;
	}
}

mv.changeVolumn($("#Volume")[0].value / $("#Volume")[0].max);

var type = $('#type li');

function tab() {
	for (var i = 0; i < type.length; i++) {
		type[i].onclick = function() {
			for (var j = 0; j < type.length; j++) {
				type[j].className = "";
			}
			this.className = "selected";
			//切换柱状或点状图
			draw.type = this.getAttribute("data-type");
		}
	}
}

tab(); //初始化

$("#uploadFile")[0].onchange = function() {
	var file = this.files[0];
	var fr = new FileReader();
	//将上一步获取的文件传递给FileReader从而将其读取为ArrayBuffer格式
	fr.readAsArrayBuffer(file);
	//文件读取完后调用此函数
	fr.onload = function(e) {
		mv.play(e.target.result); //这是读取成功得到的结果ArrayBuffer数据
	}
}