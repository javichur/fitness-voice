// Fitness Voice
// Created by javiercampos.es
// 2020-09-04

// wit + voice variables
const URL_BASE = 'http://localhost:5500/';
const URL_MODEL = URL_BASE + "assets/coach-audio-model/";
const HOTWORD = 'coach';
const HOTWORD_ACCURACY = 0.65;
const LANG = 'en-US';
const WIT_TOKEN = '<MY TOKEN HERE :)>';
const WIT_VERSION = '20200902';
const WIT_ACCURACY = 0.7;
let currentVoice = null;
let recognizer = null;
var synth = window.speechSynthesis;

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;


// pose variables
const URL_POSE_MODEL = "./my_model_pose/";
let pose_model, webcam, ctx, labelContainer, maxPredictions;
const minPartConfidence = 0.4;


async function createModel() {
  const checkpointURL = URL_MODEL + "model.json"; // model topology
  const metadataURL = URL_MODEL + "metadata.json"; // model metadata

  const recognizer = speechCommands.create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    checkpointURL,
    metadataURL);

  // check that model and metadata are loaded via HTTPS requests.
  await recognizer.ensureModelLoaded();

  return recognizer;
}

function selectVoice(lang) {
  const voices = synth.getVoices();
  for (i = 0; i < voices.length; i++) {
    if (voices[i].lang === lang) {
      return voices[i];
    }
  }
}

function speak(msg) {
  if (synth.speaking) {
    alert('Error. Your web browser is not compatible with Synthesis speaking.');
    return;
  }
  if (msg !== '') {
    var utterThis = new SpeechSynthesisUtterance(msg);
    utterThis.onend = function (event) {
      console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
      console.error('SpeechSynthesisUtterance.onerror: ' + JSON.stringify(event));
    }

    utterThis.lang = LANG;
    utterThis.voice = currentVoice;
    // utterThis.volume = 1;
    utterThis.text = msg;
    utterThis.pitch = 1;
    utterThis.rate = 1;

    synth.speak(utterThis);
  }
}

function witRequest(msg) {
  if (msg !== '') {
    $.ajax({
      url: `https://api.wit.ai/message?v=${WIT_VERSION}&q=${msg}`,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${WIT_TOKEN}`
      },
      success: function (result) {
        // CallBack(result);
        // alert('hello world' + JSON.stringify(result));
        witResponseHander(result);
      },
      error: function (error) {
        alert('error' + JSON.stringify(error));
      }
    });
  }
}

function witResponseHander(result) {
  if (!result || !result.intents || !result.intents[0] || result.intents[0].confidence < WIT_ACCURACY) {
    speak('I\'m sorry, I can\'t understand. Repeat please.');
    return; // no result
  }

  const intent = result.intents[0];
  switch (intent.name) {
    case 'letsgo':
      speak('OK, Lets go! Tell me something like "Coach, I want to traing surfing".');
      $("#helpModal").modal('hide');
      $("#genericModal").modal('hide');
      break;
    case 'set_training':
      if (!result.entities || !result.entities['sport:sport'] || !result.entities['sport:sport'][0]) {
        speak('I\'m sorry, I can\'t understand the sport. Repeat please.');
        return;
      }
      const sport = result.entities['sport:sport'][0].body;
      switch (sport) {
        case 'surfing':
          speak('Great, I like surfing! In this exercise, stand in front of the camera and move the 2 arms on each side of your body, up and down.');
          goTo('surfing');
          break;
        case 'yoga':
          speak('Nice, I like yoga!');
          goTo('yoga');
          break;
        case 'gym':
          speak('Good choice, let\'s go to the gym! In this exercise, stand on your side, and move a barbell up and down with both arms.');
          goTo('gym');
          break;
        default:
          speak('I\'m sorry, I can\'t understand the sport. Repeat please.');
          break;
      }
      break;
    case 'help':
      speak('Ok, I show you information about Fitness Voice.');
      $("#helpModal").modal();
      ding();
      break;
    case 'gohome':
      speak('Ok, going back to the home.');
      goTo('home');
      break;
    case 'stats':
      getStats();
      break;
    case 'repeat':
      // TODO
      break;
  }
}

function ding() {
  var audio = new Audio('./assets/ding.mp3');
  audio.play();
}

function applause() {
  var audio = new Audio('./assets/cheer.mp3');
  audio.play();
}

async function goTo(page) {
  switch (page) {
    case 'surfing':
      currentTraining = 'surfing';
      $('#albums').hide();
      $('#titleH1').hide();
      $('#divTraining').show();
      document.querySelector('#lblSampleUtterance').textContent = '"Coach, I want to change trainer voice"';
      initPose();
      break;

    case 'gym':
      currentTraining = 'gym';
      $('#albums').hide();
      $('#titleH1').hide();
      $('#divTraining').show();
      document.querySelector('#lblSampleUtterance').textContent = '"Coach, I want to change trainer voice"';
      initPose();
      break;
    case 'home':
      currentTraining = null;

      if (webcam) {
        await webcam.stop();
      }

      $('#albums').show();
      $('#titleH1').show();
      $('#divTraining').hide();

      await init();
      $('#helpModal').hide();

      document.querySelector('#lblSampleUtterance').textContent = '"Coach, I want to train yoga"';
      break;
  }
}

function listenHotwordOffline() {
  micAnimationPause();

  if (!recognizer.isListening()) {
    recognizer.listen(result => {
      const scores = result.scores; // probability of prediction for each class
      const classLabels = recognizer.wordLabels();
      for (let i = 0; i < classLabels.length; i++) {
        if (classLabels[i] == HOTWORD && result.scores[i].toFixed(2) >= HOTWORD_ACCURACY) {
          // const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);
          micAnimationPlay();

          try {
            recognizer.stopListening();
          } catch (error) {
            console.log('error stopping: ' + JSON.stringify(erro));
          }
          testSpeech();
          break;
        }
      }
    }, {
      includeSpectrogram: true,
      probabilityThreshold: HOTWORD_ACCURACY,
      invokeCallbackOnNoiseAndUnknown: false,
      overlapFactor: 0.50,
    });
  }
}

function micAnimationPause() {
  const m = document.querySelector('#lottiemic');
  m.pause();
  m.seek('50%');
  $("#micInHelpModal").hide();
}

function micAnimationPlay() {
  document.querySelector('#lottiemic').play();
  $("#micInHelpModal").show();
}

function getStats() {
  let ret = '';
  if (typeof (Storage) !== "undefined") {
    let gym = localStorage.getItem("total_gym");
    if(!gym) gym = 0;

    let surf = localStorage.getItem("total_surfing");
    if(!surf) surf = 0;

    ret = 'Your gym stats: ' + gym + ' moves. Surfing stats: ' + surf + ' moves.'
  } else {
    ret = 'Your statistics are not available. You must give the browser permission to store information.';
  }

  speak(ret);
}

function updateStatsGym(num) {
  var cont = localStorage.getItem("total_gym");
  if (!cont) cont = '0';
  localStorage.setItem("total_gym", parseInt(cont) + num);
}
function updateStatsSurfing(num) {
  var cont = localStorage.getItem("total_surfing");
  if (!cont) cont = '0';
  localStorage.setItem("total_surfing", parseInt(cont) + num);
}


async function init() {
  micAnimationPause();
  $('#helpModal').modal();
  $('#divTraining').hide();

  if (!currentVoice) {
    currentVoice = selectVoice(LANG);
  }

  if (!recognizer) {
    recognizer = await createModel();
  }

  listenHotwordOffline();
}

function showGenericModal(txt) {
  document.querySelector('#genericModalTitle').textContent = '🎙️ Fitness Voice';
  document.querySelector('#genericModalTxt').textContent = txt;
  $("#genericModal").modal();
}

function testSpeech() {

  // var grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + phrase +';';
  var recognition = new SpeechRecognition();
  // var speechRecognitionList = new SpeechGrammarList();
  // speechRecognitionList.addFromString(grammar, 1);
  // recognition.grammars = speechRecognitionList;
  recognition.lang = LANG;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function (event) {
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object 
    var speechResult = event.results[0][0].transcript.toLowerCase();
    // showGenericModal('Speech received: ' + speechResult);
    // speak(speechResult);
    witRequest(speechResult);

    console.log('Confidence: ' + event.results[0][0].confidence);

    listenHotwordOffline(); // reactivate tensorflow hotword detection.
  };

  recognition.onspeechend = function () {
    recognition.stop();
  }

  recognition.onerror = function (event) {
    console.log('SpeechRecognition.onerror');
    listenHotwordOffline();
  }

  recognition.onaudiostart = function (event) {
    //Fired when the user agent has started to capture audio.
    console.log('SpeechRecognition.onaudiostart');
  }

  recognition.onaudioend = function (event) {
    //Fired when the user agent has finished capturing audio.
    console.log('SpeechRecognition.onaudioend');
  }

  recognition.onend = function (event) {
    //Fired when the speech recognition service has disconnected.
    console.log('SpeechRecognition.onend');
    listenHotwordOffline();
  }

  recognition.onnomatch = function (event) {
    //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.log('SpeechRecognition.onnomatch');
  }

  recognition.onsoundstart = function (event) {
    //Fired when any sound — recognisable speech or not — has been detected.
    console.log('SpeechRecognition.onsoundstart');
  }

  recognition.onsoundend = function (event) {
    //Fired when any sound — recognisable speech or not — has stopped being detected.
    console.log('SpeechRecognition.onsoundend');
  }

  recognition.onspeechstart = function (event) {
    //Fired when sound that is recognised by the speech recognition service as speech has been detected.
    console.log('SpeechRecognition.onspeechstart');
  }
  recognition.onstart = function (event) {
    //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.log('SpeechRecognition.onstart');
  }
}

// pose methods:
const nose = 0;
const leftEye = 1;
const rightEye = 2;
const leftEar = 3;
const rightEar = 4;
const leftShoulder = 5;
const rightShoulder = 6;
const leftElbow = 7;
const rightElbow = 8;
const leftWrist = 9;
const rightWrist = 10;
const leftHip = 11;
const rightHip = 12;
const leftKnee = 13;
const rightKnee = 14;
const leftAnkle = 15;
const rightAnkle = 16;

let currentPose = null; // null | gymDown | gymUp |
let currentTraining = null; // null | gym | surfing | yoga
let postureCounter = 0;

async function initPose() {

  postureCounter = 0;
  document.querySelector('#lblCounter').textContent = postureCounter;

  const modelURL = URL_POSE_MODEL + "model.json";
  const metadataURL = URL_POSE_MODEL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  pose_model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = pose_model.getTotalClasses();

  // Convenience function to setup a webcam
  const size_html = 600;
  const size_model = 600;
  webcam = new tmPose.Webcam(size_model, size_model, true); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size_html;
  canvas.height = size_html;
  ctx = canvas.getContext("2d");
  // labelContainer = document.getElementById("label-container");
  // for (let i = 0; i < maxPredictions; i++) { // and class labels
  //   labelContainer.appendChild(document.createElement("div"));
  // }
}

async function loop(timestamp) {
  webcam.update(); // update the webcam frame
  await predictPose();
  window.requestAnimationFrame(loop);
}

async function predictPose() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await pose_model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model
  // const prediction = await pose_model.predict(posenetOutput);

  // for (let i = 0; i < maxPredictions; i++) {
  //   const classPrediction =
  //     prediction[i].className + ": " + prediction[i].probability.toFixed(2);
  //   labelContainer.childNodes[i].innerHTML = classPrediction;
  // }

  manualPosePrediction(pose);


  drawPose(pose);
}

function manualPosePrediction(pose) {
  if (pose) {
    if (currentTraining == 'surfing') {
      if (currentPose != 'gymUp') {
        if (isGymUp(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move your arms down';
          ding();
          currentPose = 'gymUp';
          postureCounter += 1;
          document.querySelector('#lblCounter').textContent = postureCounter;

          motivationInProgress(postureCounter);
          updateStatsSurfing(1);
        }
      } else if (currentPose != 'gymDown') {
        if (isGymDown(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move your arms up';
          ding();
          currentPose = 'gymDown';
          postureCounter += 1;
          document.querySelector('#lblCounter').textContent = postureCounter;

          motivationInProgress(postureCounter);
          updateStatsSurfing(1);
        }
      }
    } else if (currentTraining == 'gym') {
      if (currentPose != 'liftweightsUp') {
        if (isWeightsUp(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move the weights down';
          ding();
          currentPose = 'liftweightsUp';
          postureCounter += 1;
          document.querySelector('#lblCounter').textContent = postureCounter;

          motivationInProgress(postureCounter);
          updateStatsGym(1);
        }
      } else if (currentPose != 'liftweightsDown') {
        if (isWeightsDown(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move the weights up';
          ding();
          currentPose = 'liftweightsDown';
          postureCounter += 1;
          document.querySelector('#lblCounter').textContent = postureCounter;

          motivationInProgress(postureCounter);
          updateStatsGym(1);
        }
      }
    }
  }
}

function motivationInProgress(counter) {
  if (counter == 10) {
    speak('Perfect, you are improving your six pack. Look it! Continues until 20 repetitions.');
  } else if (counter == 5 || counter == 15) {
    speak('cheer up!');
  } else if (counter == 20) {
    applause();
    goTo('home');
  }
}

function isGymUp(pose) {
  if (pose.keypoints[leftElbow].score >= minPartConfidence &&
    pose.keypoints[leftShoulder].score >= minPartConfidence &&
    pose.keypoints[leftWrist].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[rightShoulder].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[leftElbow].position.y <= pose.keypoints[leftShoulder].position.y &&
    pose.keypoints[leftWrist].position.y <= pose.keypoints[leftElbow].position.y &&
    pose.keypoints[rightElbow].position.y <= pose.keypoints[rightShoulder].position.y &&
    pose.keypoints[rightWrist].position.y <= pose.keypoints[rightElbow].position.y)
    return true;
  return false;
}

function isGymDown(pose) {
  if (pose.keypoints[leftElbow].score >= minPartConfidence &&
    pose.keypoints[leftShoulder].score >= minPartConfidence &&
    pose.keypoints[leftWrist].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[rightShoulder].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[leftHip].position.y <= pose.keypoints[leftWrist].position.y &&
    pose.keypoints[rightHip].position.y <= pose.keypoints[rightWrist].position.y)
    return true;
  return false;
}

const DISTANCE_ACCURACY = 100;
function isWeightsUp(pose) {
  if (pose.keypoints[leftElbow].score >= minPartConfidence &&
    pose.keypoints[leftShoulder].score >= minPartConfidence &&
    pose.keypoints[leftWrist].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[rightShoulder].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[leftElbow].position.y >= pose.keypoints[leftShoulder].position.y &&
    pose.keypoints[rightElbow].position.y >= pose.keypoints[rightShoulder].position.y &&
    pose.keypoints[rightWrist].position.y <= pose.keypoints[rightElbow].position.y) {
    const difLeft = (pose.keypoints[leftWrist].position.y - pose.keypoints[leftShoulder].position.y);
    const difRight = (pose.keypoints[rightWrist].position.y - pose.keypoints[rightShoulder].position.y);

    return (Math.sqrt(difLeft * difLeft) < DISTANCE_ACCURACY) &&
      (Math.sqrt(difRight * difRight) < DISTANCE_ACCURACY);
  }
  return false;
}

function isWeightsDown(pose) {
  if (pose.keypoints[leftElbow].score >= minPartConfidence &&
    pose.keypoints[leftShoulder].score >= minPartConfidence &&
    pose.keypoints[leftWrist].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[rightShoulder].score >= minPartConfidence &&
    pose.keypoints[rightElbow].score >= minPartConfidence &&
    pose.keypoints[leftHip].position.y <= pose.keypoints[leftWrist].position.y &&
    pose.keypoints[rightHip].position.y <= pose.keypoints[rightWrist].position.y) {
    const difLeft = (pose.keypoints[leftWrist].position.y - pose.keypoints[leftHip].position.y);
    const difRight = (pose.keypoints[rightWrist].position.y - pose.keypoints[rightHip].position.y);

    return (Math.sqrt(difLeft * difLeft) < DISTANCE_ACCURACY) &&
      (Math.sqrt(difRight * difRight) < DISTANCE_ACCURACY);
  }
  return false;
}


function drawPose(pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    const canvas = document.getElementById("canvas");
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'white';
    //ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the keypoints and skeleton
    if (pose) {
      myDrawSkeleton(pose);
      myDrawKeyPoints(pose);
    }
  }
}

function myDrawKeyPoints(pose) {
  // tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
  for (let j = 0; j < pose.keypoints.length; j++) {
    let keypoint = pose.keypoints[j];
    if (keypoint.score >= minPartConfidence) {
      drawPoint(keypoint.position, 'orange');
    }
  }
}

function myDrawSkeleton(pose) {

  // head size (aprox)
  var a = pose.keypoints[nose].position.x - pose.keypoints[leftEye].position.x;
  var b = pose.keypoints[nose].position.y - pose.keypoints[leftEye].position.y;
  var c = Math.sqrt(a * a + b * b) * 2;

  var circle = new Path2D();
  circle.arc(pose.keypoints[nose].position.x, pose.keypoints[nose].position.y, c, 0, 2 * Math.PI);
  ctx.fillStyle = 'pink';
  ctx.fill(circle);

  drawLineFromKeypoints(pose.keypoints, leftShoulder, rightShoulder, '#2196F3');
  drawLineFromKeypoints(pose.keypoints, leftShoulder, leftHip, '#2196F3');
  drawLineFromKeypoints(pose.keypoints, rightShoulder, rightHip, '#2196F3');
  drawLineFromKeypoints(pose.keypoints, leftHip, rightHip, '#2196F3');

  drawLineFromKeypoints(pose.keypoints, leftShoulder, leftElbow, 'red');
  drawLineFromKeypoints(pose.keypoints, leftElbow, leftWrist, 'red');

  drawLineFromKeypoints(pose.keypoints, rightShoulder, rightElbow, 'red');
  drawLineFromKeypoints(pose.keypoints, rightElbow, rightWrist, 'red');

  drawLineFromKeypoints(pose.keypoints, leftHip, leftKnee, 'green');
  drawLineFromKeypoints(pose.keypoints, leftKnee, leftAnkle, 'green');

  drawLineFromKeypoints(pose.keypoints, rightHip, rightKnee, 'green');
  drawLineFromKeypoints(pose.keypoints, rightKnee, rightAnkle, 'green');

  if (postureCounter >= 10) {
    drawSixPack(pose.keypoints);
  }
}

function drawPoint(p, color) {
  var circle = new Path2D();
  circle.arc(p.x, p.y, 10, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill(circle);
}

function drawLineFromKeypoints(keypoints, a, b, color) {
  if (keypoints[a].score >= minPartConfidence && keypoints[b].score >= minPartConfidence) {
    drawLineFromXY(keypoints[a].position, keypoints[b].position, color);
  }
}

function drawLineFromXY(a, b, color) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineWidth = 8;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSixPack(keypoints) {
  const w = {
    x: keypoints[rightHip].position.x - keypoints[leftHip].position.x,
    y: keypoints[rightHip].position.y - keypoints[leftHip].position.y,
  }

  const height = {
    x: keypoints[leftShoulder].position.x - keypoints[leftHip].position.x,
    y: keypoints[leftShoulder].position.y - keypoints[leftHip].position.y,
  }

  const a = {
    x: keypoints[leftHip].position.x + (w.x / 4),
    y: keypoints[leftHip].position.y + (w.y / 4),
  };

  const b = {
    x: keypoints[leftHip].position.x + (w.x / 4) * 3,
    y: keypoints[leftHip].position.y + (w.y / 4) * 3,
  };

  const c = {
    x: a.x + (height.x / 2),
    y: a.y + (height.y / 2),
  };

  const d = {
    x: b.x + (height.x / 2),
    y: b.y + (height.y / 2),
  };

  const e = {
    x: a.x + (b.x - a.x) / 2,
    y: a.y + (b.y - a.y) / 2,
  };
  const f = {
    x: c.x + (d.x - c.x) / 2,
    y: c.y + (d.y - c.y) / 2,
  };

  const g = {
    x: a.x + (c.x - a.x) / 3,
    y: a.y + (c.y - a.y) / 3,
  };
  const h = {
    x: b.x + (d.x - b.x) / 3,
    y: b.y + (d.y - b.y) / 3,
  };

  const i = {
    x: a.x + ((c.x - a.x) / 3) * 2,
    y: a.y + ((c.y - a.y) / 3) * 2,
  };
  const j = {
    x: b.x + ((d.x - b.x) / 3) * 2,
    y: b.y + ((d.y - b.y) / 3) * 2,
  };

  drawLineFromXY(a, c, 'red');
  drawLineFromXY(b, d, 'red');
  drawLineFromXY(c, d, 'red');

  drawLineFromXY(e, f, 'red');
  drawLineFromXY(g, h, 'red');
  drawLineFromXY(i, j, 'red');
}
