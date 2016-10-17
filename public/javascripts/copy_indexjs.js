//js模仿jquery，获取dom节点
function $(s) {
	return document.querySelectorAll(s);
}


var list = $("#nav li");
for (var i = 0; i < list.length; i++) {
	list[i].onclick = function() {
		for (var j = 0; j < list.length; j++) {
			list[j].className = "";
		}
		this.className = "selected";
		load("/media/" + this.title)
	}
}

var xhr = new XMLHttpRequest();
var ac = new(window.AudioContext || window.webkitAudioContext)();
var gainNode = ac[ac.createGain() ? "createGain" : "createGinNode"]();
gainNode.connect(ac.destination);

var analyser = ac.createAnalyser();
//行的频率数
var size = 128;
//高的振幅数为频率的2倍
analyser.fftsize = size * 2;
analyser.connect(gainNode);

//控制全局歌曲播放
var source = null;
//全局count，有歌曲播放时发生变化。
var count = 0;

var canvasCont = $("#canvasCont")[0];
var height, width;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvasCont.appendChild(canvas);
var Dots = [];

function random(m, n) {
	//返回 n-m 之间的整数
	return Math.round(Math.random() * (n - m) + m)
}

function getDots() {
	Dots = [];
	for (var i = 0; i < size; i++) {
		var x = random(0, width);
		var y = random(0, height);
		var color = "rgb(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ")";
		Dots.push({
			x: x,
			y: y,
			color: color
		})
	}
}
var line;

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
	ctx.fillStyle = line;
	for (var i = 0; i < size; i++) {
		if (draw.type == "column") {
			var h = arr[i] / 256 * height;
			ctx.fillRect(w * i, height - h, w * 0.6, h);

		} else if (draw.type == "dot") {
			ctx.beginPath();
			var o = Dots[i];
			var r = arr[i] / 256 * 50;
			ctx.arc(o.x, o.y, r, 0, Math.PI * 2, true);
			var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
			g.addColorStop(0, "#fff");
			g.addColorStop(1, o.color);
			ctx.fillStyle = g;
			ctx.fill();
			// 设置线条样式
			//ctx.strokeStyle = "#fff";
			//ctx.stroke();
		}
	}
}
// 默认柱状图
draw.type = "column";

function load(url) {
	var n = ++count;
	// 停止当前播放的歌曲
	source && source[source.stop ? "stop" : "noteoff"]();
	// 终止上一次的ajax的请求
	xhr.abort();
	xhr.open("GET", url);
	xhr.responseType = "arraybuffer";
	xhr.onload = function() {
		// 判断一首歌开始播放时， 中间是否有切歌。 有， 暂停当前的”解码“
		if (n != count) return;
		//将数据解码
		ac.decodeAudioData(xhr.response, function(buffer) {
			// 判断一首歌开始播放时， 中间是否有切歌。 有， 暂停当前的”播放“
			if (n != count) return;
			var bufferSource = ac.createBufferSource();
			bufferSource.buffer = buffer;
			bufferSource.connect(analyser);
			bufferSource[bufferSource.start ? "start" : "noteOn"]();
			// 保存当前播放信息
			source = bufferSource;
		}, function(err) {
			console.log(err);
		})
	}
	xhr.send();
}

function visualizer() {
	//获取频率信息
	var arr = new Uint8Array(analyser.frequencyBinCount);

	requestAnimationFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame;

	function v() {
		analyser.getByteFrequencyData(arr);
		draw(arr);
		// 循环调用，获取实时音频数据
		requestAnimationFrame(v);
	}
	requestAnimationFrame(v);
}
visualizer();

function changeVolume(percent) {
	gainNode.gain.value = percent * percent;
}

$("#Volume")[0].onmousedown = function() {
	this.onmousemove = function() {
		changeVolume(this.value / this.max);
	}
	this.onmouseup = function() {
		this.onmousemove = false;
	}
}

changeVolume($("#Volume")[0].value / $("#Volume")[0].max);

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

tab();