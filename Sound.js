window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

var canvasWith = window.innerWidth;
var canvasHeight = window.innerHeight;
var mouseX = 0
var mouseY = 0
var start = true
var kick = 60
var amplitude = 2
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / canvasWith) * 255
    mouseY = (e.clientY / canvasHeight) * 255

})
/**
 *
 * Sound stuff
 *
 */
var audioCtx = new AudioContext();
var audioBuffer;
var audioSource;
var analyser = audioCtx.createAnalyser();
//analyser.smoothingTimeConstant = 1;
console.log(analyser.smoothingTimeConstant);

var frequencyData = new Uint8Array(analyser.frequencyBinCount)
const waveform = new Float32Array(analyser.frequencyBinCount)


/**
  Time stuff
*/
var DELTA_TIME = 16 / 1000;
var LAST_TIME = Date.now();

/**
  Canvas stuff
*/
var canvasBcg
var ctxBcg


var opts = {
    barWidth: 10
}

function initCanvas() {

    canvasBcg = document.querySelector('.background')
    ctxBcg = canvasBcg.getContext('2d')

    onResize()

}

function loadSound(url) {
    var request = new XMLHttpRequest();
    request.open('GET', './assets/ArchiePelago-Chronomancer.mp3', true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function () {

        audioCtx.decodeAudioData(request.response, function (buffer) {

            // success callback
            audioBuffer = buffer;

            // Create sound from buffer
            audioSource = audioCtx.createBufferSource();
            audioSource.buffer = audioBuffer;

            // connect the audio source to context's output
            audioSource.connect(analyser)
            analyser.connect(audioCtx.destination)
            
            startSong()

        }, function () {

            // error callback
            //
        });
    }
    request.send();
}


/**
 * addListeners
 */

 function startSong() {
        window.addEventListener('click', () => {
            if (start) {
                audioSource.start();
                addListeners()
                frame()
                updateWaveform()

                document.querySelector('section').style.display = "none"
                start = false
            }
        })
 }


function addListeners() {

    window.addEventListener('resize', onResize.bind(this));
    rafId = requestAnimationFrame(frame)

}

/**
 * update
 * - Triggered on every TweenMax tick
 */


function updateWaveform() {
    requestAnimationFrame(updateWaveform)
    analyser.getFloatTimeDomainData(waveform)
   
}

function frame() {

    rafId = requestAnimationFrame(frame)

    DELTA_TIME = (Date.now() - LAST_TIME) / 1000;
    LAST_TIME = Date.now();

    // analyser.getByteFrequencyData(frequencyData);


    analyser.getByteFrequencyData(frequencyData);
   // ctxBcg.clearRect(0, 0, canvasWith, canvasHeight)
    // Create the filter

    var barWidth = opts.barWidth;
    var margin = 2;
    var nbBars = canvasWith / (barWidth - margin);

    var cumul = 0;
    var average = 0;
//    ctxBcg.fillStyle = 'red'
//    ctxBcg.beginPath()
    // mainBottom.ctx.clearRect(0, 0,window.innerWidth, window.innerHeight)
    // mainTop.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    mainLeft.ctx.clearRect(0, 0,window.innerWidth, window.innerHeight)
    mainRight.ctx.clearRect(0, 0,window.innerWidth, window.innerHeight)

    for (var i = 0; i < nbBars; i++) {

        // get the frequency according to current i
        let percentIdx = i / nbBars;
        let frequencyIdx = Math.floor(1024 * percentIdx)
    
        //ctxBcg.rect(i * barWidth + (i * margin), canvasHeight - frequencyData[frequencyIdx], barWidth, frequencyData[frequencyIdx]);
        // mainBottom.update(frequencyData[frequencyIdx])
        // mainTop.update(frequencyData[frequencyIdx])
        mainLeft.update(frequencyData[frequencyIdx])
        mainRight.update(frequencyData[frequencyIdx])
        cumul += frequencyData[frequencyIdx];


    }
    //ctxBcg.fill()
    //ctxBcg.closePath()

    average = cumul / 255;

    for (let i = 0; i < particules.length; i++) {
        if (average > kick) {
            
            (Math.random() >= 0.5) ? particules[i].positions.x = canvasBcg.width - 5 : particules[i].positions.x = 5
            particules[i].positions.y = getRandomInt(canvasBcg.height)
        }
        particules[i].update()
    }




    let x = 0
    let y = 0

    for (let i = 0; i < waveform.length; i = i + 3) {
        // ctxBcg.strokeStyle = 'blue'
        if (waveform[i]) {
            x = i * (canvasBcg.width / waveform.length)
            y = (0.5 + waveform[i] / amplitude) * canvasBcg.height;
            
            for (let i = 0; i < particules.length; i++) {
                if (particules[i]) {
                    let dx = x - particules[i].positions.x
                    let dy = y - particules[i].positions.y
                    if (Math.sqrt(dx * dx + dy * dy) <= 80) {
                        ctxBcg.beginPath()
                        var gradient = ctxBcg.createLinearGradient(x, y, particules[i].positions.x, particules[i].positions.y);
                        gradient.addColorStop(0, `rgba(${Math.abs(waveform[i])*255},  ${mouseX}, ${mouseY}, 1)`);
                        gradient.addColorStop(1, 'white');
                        ctxBcg.strokeStyle = gradient
                        ctxBcg.moveTo(x, y)
                        ctxBcg.lineTo(particules[i].positions.x, particules[i].positions.y)
                        ctxBcg.lineWidth = 1;
                        ctxBcg.stroke()
                        ctxBcg.closePath()
                    }
                }
            }

            oscilo.update(x,y, waveform[i])
        }
    }

}


/**
 * onResize
 * - Triggered when window is resized
 * @param  {obj} evt
 */
function onResize(evt) {

    canvasWith = window.innerWidth;
    canvasHeight = window.innerHeight;

    canvasBcg.width = canvasWith
    canvasBcg.height = canvasHeight
    canvasBcg.style.width = canvasWith + 'px'
    canvasBcg.style.height = canvasHeight + 'px'

}

class Particule {
    constructor(canvasBcg) {
        //console.log('new');

        this.canvasBcg = {
            width: canvasBcg.width,
            height: canvasBcg.height
        }

        this.positions = {
            x: getRandomInt(canvasBcg.width),
            y: getRandomInt(canvasBcg.height)
        }




        this.speed = 2

        this.dir = {
            x: Math.random() * this.speed * 2 - this.speed,
            y: Math.random() * this.speed * 2 - this.speed,
        }

        this.draw(this.positions)
        this.update()

    }

    draw() {
        ctxBcg.beginPath()
        ctxBcg.fillStyle = "black"
        ctxBcg.globalAlpha = Math.random()*0.5
        let x = Math.random() * 150
        let y = Math.random() * 150
        ctxBcg.rect(this.positions.x - x/2, this.positions.y - y/2, x, y)
        ctxBcg.fill()
        ctxBcg.closePath()

    }

    update() {
        if (this.positions.x >= canvasBcg.width || this.positions.x <= 0) {
            this.dir.x = -this.dir.x
        }

        if (this.positions.y >= canvasBcg.height || this.positions.y <= 0) {

            this.dir.y = -this.dir.y
        }

        this.positions.x += this.dir.x
        this.positions.y += this.dir.y

        this.draw()

    }

}

class Oscilo {
    constructor() {

        this.currentTime = 0

        this.canvasBcg = {
            width: canvasBcg.width,
            height: canvasBcg.height
        }

        this.positions = {
            x: 0,
            y: 0
        }

        this.rotation = 0
        this.drawPoints()
        this.color = `rgba(206, 71, 237, 1)`

    }

    drawPoints() {
        ctxBcg.beginPath()
        ctxBcg.globalAlpha = .1
        ctxBcg.fillStyle = this.color
        ctxBcg.arc(this.positions.x, this.positions.y, 1, 0, Math.PI * 2)
        ctxBcg.fill()
        ctxBcg.closePath()

    }

 

    update(x, y, waveform) {
        this.currentTime += DELTA_TIME
        this.color = `rgba(${Math.abs(waveform)*255}, ${mouseX}, ${mouseY}, 1)`
        this.positions.x = x
        this.positions.y = y
        this.drawPoints()
    }
}

class Main {
    constructor(rot) {

        this.canvas = document.querySelector('.main')
        this.ctx = this.canvas.getContext('2d')
        document.querySelector('.main').style.mixBlendMode = "overlay"
        this.currentTime = 0
        
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        
        this.positions = {
            x: 0,
            y: 0
        }
        //this.ctx.globalCompositeOperation = 'soft-light'
        this.currentTime = 0
        this.rotation = rot
        this.scale = 1
        this.draw()

    }

    draw() {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.fillStyle = "white"
        this.ctx.translate((window.innerWidth / 2), (window.innerHeight / 2))
        this.ctx.rotate(this.rotation)
        this.ctx.scale(this.scale, this.scale)
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.width)
        this.ctx.fill()
        this.ctx.closePath()

        this.ctx.clearRect(100, 100, this.canvas.width - 200, this.canvas.width - 200)

        this.ctx.restore()

    }



    update(pulse) {
        this.currentTime += DELTA_TIME
        this.scale = pulse / 255
        this.draw()
    }
}




initCanvas()
const particules = []

for (let i = 0; i < 50; i++) {
    particules.push(new Particule(canvasBcg))
}

const oscilo = new Oscilo(canvasBcg)

// const mainBottom = new Main(Math.PI / 4)
const mainRight = new Main(-Math.PI / 4)
// const mainTop = new Main(Math.PI + Math.PI/4)
const mainLeft = new Main(Math.PI - Math.PI / 4)

loadSound()

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'
    var color = '#'
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}
window.addEventListener('mousewheel', (e) => {
    // mainBottom.rotation += e.deltaY/100
    // mainRight.rotation += e.deltaY/100
    // // mainTop.rotation += e.deltaY/100
    // mainLeft.rotation += e.deltaY/100

   
    if (amplitude <= 5 && amplitude > 0) {
        amplitude = Math.abs(amplitude + e.deltaY/10000)
        if (amplitude > 5) {
            amplitude -= 1
        }
    }

    console.log(amplitude);
    
})

document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    if (keyName == "ArrowUp" && kick <= 120) {
         kick += 2
    }
    if (keyName == "ArrowDown" && kick > 30) {
         kick -= 2
    }

})


// window.addEventListener('mousedown', (e) => {
//     console.log('test');
    

// var biquadFilter = audioCtx.createBiquadFilter();

// biquadFilter.connect(audioCtx.destination);

// biquadFilter.type = "lowpass";
// biquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
// biquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);

// })