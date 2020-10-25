// Fitness Voice
// Created by javiercampos.es
// Last update: 2020-10-24

import { BodyPainter } from './bodyPainter.js';
import { SimplePoseDetection } from './simplePoseDetection.js';
import { Settings } from './settings.js';
import * as SoundEffects from './soundEffects.js';
import * as UI from './ui.js';
import { HotWord } from './hotword.js';
import { ListenCommand } from './listenCommand.js';
import { Voice } from './voice.js';
import { VoiceClone } from './voiceClone.js';

// pose variables
let pose_model;
let webcam;
let currentPose = null; // null | gymDown | gymUp | liftweightsUp | liftweightsDown | yoga
let currentTraining = null; // null | gym | surfing | yoga
let painter = null; // BodyPainter class.

let isFirstInit = true;

export async function init() {
  UI.initUI();

  HotWord.isIdle = true;
  HotWord.handlerHotWordDetected = handlerHotwordDetected;

  ListenCommand.handlerlistened = witRequest;
  ListenCommand.handlerEnd = handlerListenCommandEnd;

  Voice.selectVoice(Settings.LANG);
  if (isFirstInit) {
    Voice.speak('Welcome to Fitness Voice, the AI voice-controlled trainer in your browser.');
    isFirstInit = false;
  }

  await HotWord.createHotwordModelIfNotExists();
  HotWord.listenHotwordOffline();
}

function handlerHotwordDetected() {
  UI.micAnimationPlay();

  try {
    ListenCommand.testSpeech();
  } catch (error) {
    console.log('error handlerHotwordDetected: ' + JSON.stringify(error));
  }
}

function handlerListenCommandEnd() {
  HotWord.isIdle = true;
  UI.micAnimationPause();
}


function witRequest(msg) {
  if (msg !== '') {
    $.ajax({
      url: `https://api.wit.ai/message?v=${Settings.WIT_VERSION}&q=${msg}`,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${Settings.WIT_TOKEN}`
      },
      success: function (result) {
        witResponseHander(result);
      },
      error: function (error) {
        alert('error' + JSON.stringify(error));
      }
    });
  }
}

function isWitNotUndertand(result) {
  return !result || !result.intents || !result.intents[0] || result.intents[0].confidence < Settings.WIT_ACCURACY;
}

function witResponseHander(result) {
  if (isWitNotUndertand(result)) {
    Voice.speak('I\'m sorry, I can\'t understand. Repeat please.');
    return;
  }

  const intent = result.intents[0];
  switch (intent.name) {
    case 'letsgo':
      witIntentHandlerLetsGo();
      break;
    case 'set_training':
      witIntentHandlerSetTraining(result);
      break;
    case 'help':
      witIntentHandlerHelp();
      break;
    case 'gohome':
      witIntentHandlerGoHome();
      break;
    case 'stats':
      goTo('stats');
      break;
    case 'set_voice':
      witIntentHandlerSetVoice(result);
      break;
    case 'repeat':
      // TODO
      break;
  }
}

function witIntentHandlerLetsGo() {
  Voice.speak('OK, Lets go! Tell me something like "I want to traing surfing".');
  $("#helpModal").modal('hide');
  $("#genericModal").modal('hide');
}

function witIntentHandlerHelp() {
  Voice.speak('Ok, I show you information about Fitness Voice.');
  $("#helpModal").modal();
  SoundEffects.ding();
}

function witIntentHandlerGoHome() {
  if (!VoiceClone.currentAudioVoice) Voice.speak('Ok, going back to the home.');
  else speakWithAudioVoice('home');
  goTo('home');
}

function witIntentHandlerSetTraining(result) {
  if (!result.entities || !result.entities['sport:sport'] || !result.entities['sport:sport'][0]) {
    Voice.speak('I\'m sorry, I can\'t understand the sport. Repeat please.');
    return;
  }
  const sport = result.entities['sport:sport'][0].body;
  switch (sport) {
    case 'surfing':
      if (!VoiceClone.currentAudioVoice) Voice.speak('Great, I like surfing! In this exercise, stand in front of the camera and move the 2 arms on each side of your body, up and down.');
      else VoiceClone.speakWithAudioVoice('surf');
      goTo('surfing');
      break;
    case 'yoga':
      Voice.speak('Nice, I like yoga!');
      goTo('yoga');
      break;
    case 'gym':
      if (!VoiceClone.currentAudioVoice) Voice.speak('Good choice, let\'s go to the gym! In this exercise, stand on your side, and move a barbell up and down with both arms.');
      else VoiceClone.speakWithAudioVoice('gym');
      goTo('gym');
      break;
    default:
      Voice.speak('I\'m sorry, I can\'t understand the sport. Repeat please.');
      break;
  }
}

function witIntentHandlerSetVoice(result) {
  if (!result.entities || !result.entities['person:person'] || !result.entities['person:person'][0]) {
    speak('I\'m sorry, I can\'t understand the voice you choose. You can say Bill, Her, Joker, Morgan, Morpheus or Yellow. Repeat please.');
    return;
  }
  let person = result.entities['person:person'][0].body.toLowerCase();

  if (VoiceClone.isValidVoiceName(person)) {
    VoiceClone.currentAudioVoice = person;
    Voice.speak('Perfect! The next training will be led by ' + person);
  } else {
    VoiceClone.currentAudioVoice = null;
    Voice.speak('Okay! The next training will be led by computer voice.');
  }
}

async function goTo(page) {
  switch (page) {
    case 'stats':
      currentTraining = null;

      if (webcam) {
        await webcam.stop();
        webcam = null;
      }

      $('#albums').hide();
      $('#divTraining').hide();
      let txt = UI.getStats();
      Voice.speak(txt);
      break;
    case 'surfing':
      currentTraining = 'surfing';
      $('#albums').hide();
      $('#titleH1').hide();
      $('#divTraining').show();
      $('#divCanvasCam').show();
      $('#divStats').hide();
      $('#lblCounter').show();
      $('#imgYoga').hide();
      document.querySelector('#lblPosture').textContent = '';
      initPose();
      break;

    case 'yoga':
      currentTraining = 'yoga';
      $('#albums').hide();
      $('#titleH1').hide();
      $('#divTraining').show();
      $('#divCanvasCam').show();
      $('#divStats').hide();
      $('#lblCounter').hide();
      $('#imgYoga').show();
      document.querySelector('#lblPosture').textContent = 'Try to repeat the Tree figure';
      initPose();
      break;

    case 'gym':
      currentTraining = 'gym';
      $('#albums').hide();
      $('#titleH1').hide();
      $('#divTraining').show();
      $('#divCanvasCam').show();
      $('#divStats').hide();
      $('#lblCounter').show();
      $('#imgYoga').hide();
      document.querySelector('#lblPosture').textContent = '';
      initPose();
      break;
    case 'home':
      if (currentTraining && webcam) {
        currentTraining = null;
        await webcam.stop();
        webcam = null;
      }

      $('#divTraining').hide();
      $('#albums').show();
      $('#titleH1').show();
      $('#divStats').hide();

      await init();
      //$('#helpModal').hide();
      break;
  }
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
function updateStatsYoga(num) {
  var cont = localStorage.getItem("total_yoga");
  if (!cont) cont = '0';
  localStorage.setItem("total_yoga", parseInt(cont) + num);
}

// pose methods:

async function initPose() {

  UI.cameraLoading();

  const modelURL = Settings.URL_POSE_MODEL + 'model.json';
  const metadataURL = Settings.URL_POSE_MODEL + 'metadata.json';

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  pose_model = await tmPose.load(modelURL, metadataURL);

  // Convenience function to setup a webcam
  const size_html = 600;
  const size_model = 600;
  webcam = new tmPose.Webcam(800, size_model, true); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  UI.cameraLoaded();

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = 800;
  canvas.height = size_html;
  painter = new BodyPainter(canvas, Settings.MIN_PART_CONFIDENCE);

  SimplePoseDetection.minPartConfidence = Settings.MIN_PART_CONFIDENCE;

  painter.postureCounter = 0;
}

async function loop(timestamp) {
  if (webcam) {
    webcam.update(); // update the webcam frame
    await predictPose();
    window.requestAnimationFrame(loop);
  }
}

async function predictPose() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await pose_model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model

  manualPosePrediction(pose);

  painter.drawPose(pose, webcam);
}

function manualPosePrediction(pose) {
  if (pose) {
    if (currentTraining == 'surfing') {
      if (currentPose != 'gymUp') {
        if (SimplePoseDetection.isGymUp(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move your arms down';
          SoundEffects.ding();
          currentPose = 'gymUp';
          incrementPostureCounter();

          updateStatsSurfing(1);
          motivationInProgress(painter.postureCounter);
        }
      } else if (currentPose != 'gymDown') {
        if (SimplePoseDetection.isGymDown(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move your arms up';
          SoundEffects.ding();
          currentPose = 'gymDown';
          incrementPostureCounter();

          updateStatsSurfing(1);
          motivationInProgress(painter.postureCounter);
        }
      }
    } else if (currentTraining == 'gym') {
      if (currentPose != 'liftweightsUp') {
        if (SimplePoseDetection.isWeightsUp(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move the weights down';
          SoundEffects.ding();
          currentPose = 'liftweightsUp';
          incrementPostureCounter();

          updateStatsGym(1);
          motivationInProgress(painter.postureCounter);
        }
      } else if (currentPose != 'liftweightsDown') {
        if (SimplePoseDetection.isWeightsDown(pose)) {
          document.querySelector('#lblPosture').textContent = 'Move the weights up';
          SoundEffects.ding();
          currentPose = 'liftweightsDown';
          incrementPostureCounter();

          updateStatsGym(1);
          motivationInProgress(painter.postureCounter);
        }
      }
    } else if (currentTraining == 'yoga') {
      if (SimplePoseDetection.isTreeFigure(pose)) {
        SoundEffects.applause();
        updateStatsYoga(1);
        goTo('stats');
      }
    }
  }
}

function incrementPostureCounter() {
  painter.postureCounter += 1;
  document.querySelector('#lblCounter').textContent = painter.postureCounter;
}

function motivationInProgress(counter) {
  if (counter == 10) {
    if (!VoiceClone.currentAudioVoice) Voice.speak('Perfect, you are improving your six pack. Look it! Continues until 20 repetitions.');
    else speakWithAudioVoice('perfect');
  } else if (counter == 5 || counter == 15) {
    if (!VoiceClone.currentAudioVoice) Voice.speak('cheer up!');
    else speakWithAudioVoice('cheerup');
  } else if (counter == 20) {
    SoundEffects.applause();
    goTo('stats');
  }
}

window.showGenericModal = UI.showGenericModal;

window.addEventListener('load', init);