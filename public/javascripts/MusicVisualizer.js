function MusicVisualizer(obj) {
	this.source = null;
	this.count = 0;

	this.analyser = MusicVisualizer.ac.createAnalyser();
	this.size = obj.size;
	this.analyser.fftsize = this.size * 2;

	this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain() ? "createGain" : "createGainNode"]();
	this.gainNode.connect(MusicVisualizer.ac.destination);

	this.analyser.connect(this.gainNode);

	this.xhr = new XMLHttpRequest(); //建立一个请求

	this.visualizer = obj.visualizer;

	this.drawProcess = obj.drawProcess;

	this.visualize();

	this.file = null; //要处理的文件，后面会讲解如何获取文件
	this.flieName = null; //要处理的文件的名，文件名

}
MusicVisualizer.ac = new window.AudioContext;

MusicVisualizer.prototype.load = function(url, fun) {
	this.xhr.abort();
	this.xhr.open("Get", url); //配置好请求类型，文件路径等
	this.xhr.responseType = "arraybuffer"; //配置数据返回类型
	var self = this;
	// 一旦获取完成，对音频进行进一步操作，比如解码.进入回调函数 fun
	this.xhr.onload = function() {
		fun(self.xhr.response);
	}
	this.xhr.send();
}
MusicVisualizer.prototype.decode = function(arraybuffer, fun) {
	MusicVisualizer.ac.decodeAudioData(arraybuffer, function(buffer) {
		fun(buffer);
	}, function(err) {
		console.log(err);
	})
}

MusicVisualizer.prototype.play = function(url) {
	var n = ++this.count;
	var self = this;
	this.source && this.stop();
	// 已经是arrrybuffer格式，不用转换
	if (url instanceof ArrayBuffer) {

		if (n != self.count) return;
		//解码成功则调用此函数，参数buffer为解码后得到的结果
		self.decode(url, function(buffer) {
			if (n != self.count) return;
			var bs = MusicVisualizer.ac.createBufferSource();

			bs.connect(self.analyser);
			bs.buffer = buffer;
			bs[bs.start ? "start" : "noteOn"]();
			self.source = bs;
		})
	}
	if (typeof url === 'string') {
		//ajax请求成功
		this.load(url, function(arraybuffer) {
			if (n != self.count) return;
			//解码成功则调用此函数，参数buffer为解码后得到的结果
			self.decode(arraybuffer, function(buffer) {
				if (n != self.count) return;
				var bs = MusicVisualizer.ac.createBufferSource();
				//报数据传到 analyser
				bs.connect(self.analyser);
				bs.buffer = buffer;

				bs[bs.start ? "start" : "noteOn"]();
				// 显示进度条
				// self.process(bs.buffer.duration);
				self.source = bs;
			})
		})
	}

}
MusicVisualizer.prototype.process = function(total_time) {
	var self = this;
	var count = 0;
	clearInterval(t);
	var t = setInterval(function() {
		if (count > total_time * 1000) {
			clearInterval(t);
		} else {
			count += 60;
			self.drawProcess(total_time);
		}
	}, 60)
}
MusicVisualizer.prototype.stop = function() {
	this.source[this.source.stop ? "stop" : "noteOff"]();
}

MusicVisualizer.prototype.changeVolumn = function(percent) {
	this.gainNode.gain.value = percent * percent;
}
MusicVisualizer.prototype.visualize = function() {
	//通过analyser获取频率信息，数组arr保存音频数据
	var arr = new Uint8Array(this.analyser.frequencyBinCount);

	requestAnimationFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame;

	var self = this;

	function v() {
		self.analyser.getByteFrequencyData(arr);
		// 循环调用，获取实时音频数据
		self.visualizer(arr); //visualizer 相当于 draw()
		//递归
		requestAnimationFrame(v);
	}
	//开始执行动画
	requestAnimationFrame(v);
}