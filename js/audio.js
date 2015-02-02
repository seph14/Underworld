var context;

function initAudioContext() {
  try {
    // Fix up for prefixing
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();
  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
}

function updateProgress(evt) {
   if (evt.lengthComputable) 
   {  //evt.loaded the bytes browser receive
      //evt.total the total bytes seted by the header
     var percentComplete = (evt.loaded / evt.total)*100;  
   } 
}   

function loadSound(url, updateProgress, clipBuffer) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  req.onprogress       = updateProgress;
  
  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      clipBuffer = buffer;
    }, onError);
  }
  request.send();
}

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index, updateProgress) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onprogress = updateProgress;
  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

function BackgroundMusic() {
  this.urls     = [];
  this.sources  = [];
  this.buffers  = [];
  this.gains    = [];

  this.playing  = false;
}

BackgroundMusic.prototype.addSource = function( url ){
  this.urls.push( url );
}

BackgroundMusic.prototype.load      = function(){
  var onLoad = function(buffers) { this.buffers = buffers; };
  var loader = new BufferLoader(context, this.urls, onLoad);
  loader.load();
}

BackgroundMusic.prototype.playPause = function() {
  if (this.playing) {
    // Stop all sources.
    for (var i = 0, length = this.sources.length; i < length; i++) {
      var src = this.sources[i];
      src.stop(0);
    }
  } else {
    var targetStart = context.currentTime + 0.1;
    // Start all sources simultaneously.
    for (var i = 0, length = this.buffers.length; i < length; i++) {
      this.playSound(i, targetStart);
    }
    this.setIntensity(0);
  }
  this.playing = !this.playing;
}

BackgroundMusic.prototype.setIntensity = function(normVal) {
  var value = normVal * (this.gains.length - 1);
  // First reset gains on all nodes.
  for (var i = 0; i < this.gains.length; i++) {
    this.gains[i].gain.value = 0;
  }
  // Decide which two nodes we are currently between, and do an equal
  // power crossfade between them.
  var leftNode = Math.floor(value);
  // Normalize the value between 0 and 1.
  var x     = value - leftNode;
  var gain1 = Math.cos(x * 0.5 * Math.PI);
  var gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI);
  //console.log(gain1, gain2);
  // Set the two gains accordingly.
  this.gains[leftNode].gain.value = gain1;
  // Check to make sure that there's a right node.
  if (leftNode < this.gains.length - 1) {
    // If there is, adjust its gain.
    this.gains[leftNode + 1].gain.value = gain2;
  }
}

BackgroundMusic.prototype.playSound = function(index, targetTime) {
  var buffer    = this.buffers[index];
  var source    = context.createBufferSource();
  source.buffer = buffer;
  source.loop   = true;
  
  var gainNode  = context.createGainNode();
  
  source.connect(gainNode);
  gainNode.connect(context.destination);
  this.sources[index] = source;
  this.gains[index]   = gainNode;
  source.start(targetTime);
}