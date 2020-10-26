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

let poseModel = null;
let webcam = null;
let currentPose = null; // null | gymDown | gymUp | liftweightsUp | liftweightsDown | yoga
let currentTraining = null; // null | gym | surfing | yoga
let painter = null; // BodyPainter class.

let isFirstInit = true;

export async function init() {
  UI.initUI();

  // 1. It will run handlerHotwordDetected() when the hotword is detected.
  HotWord.isIdle = true;
  HotWord.handlerHotWordDetected = handlerHotwordDetected;

  await HotWord.createHotwordModelIfNotExists(); // 2. Initialize hotword detection.
  HotWord.listenHotwordOffline();

  // 3. It will run witRequest(message) after listening a right user voice.
  ListenCommand.handlerlistened = witRequest;

  // 4. It will run handlerListenCommandEnd() when listening ends.
  ListenCommand.handlerEnd = handlerListenCommandEnd; // clue: it reactivates hotword detection.

  Voice.selectVoice(Settings.LANG);
  if (isFirstInit) { // 5. Welcome voice message
    Voice.speak('Welcome to Fitness Voice, the AI voice-controlled trainer in your browser.');
    isFirstInit = false;
  }
}

function handlerHotwordDetected() {
  UI.micAnimationPlay();

  try {
    ListenCommand.testSpeech(); // listening the command
  } catch (error) {
    console.log('error handlerHotwordDetected: ' + JSON.stringify(error));
  }
}

function handlerListenCommandEnd() {
  HotWord.isIdle = true; // activate hotword detection again.
  UI.micAnimationPause();
}


function witRequest(message) {
  if (message !== '') {
    $.ajax({
      url: `https://api.wit.ai/message?v=${Settings.WIT_VERSION}&q=${message}`,
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
  if (!hasWitUnderstoodTheSport(result)) {
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
      // impossible case. hasWitUnderstoodTheSport() is checked first.
      break;
  }
}

function hasWitUnderstoodTheSport(result) {
  if(!result.entities || !result.entities['sport:sport'] || !result.entities['sport:sport'][0]) {
    return false;
  }
  const sport = result.entities['sport:sport'][0].body;
  const allSports = ['surfing', 'yoga', 'gym'];
  return allSports.includes(sport);
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
      await stopTrainingAndWebcam();
      let txt = UI.showStats();
      Voice.speak(txt);
      break;

    case 'surfing':
    case 'gym':
      currentTraining = page;
      UI.showSurfOrGym();
      initPoseAndWebcam();
      break;

    case 'yoga':
      currentTraining = 'yoga';
      UI.showYoga();
      initPoseAndWebcam();
      break;

    case 'home':
      await stopTrainingAndWebcam();
      await init();
      break;
  }
}

async function stopTrainingAndWebcam() {
  currentTraining = null;
  if (webcam) {
    await webcam.stop();
    webcam = null;
  }
}

function updateStatsCurrentTraining(num) {
  var cont = localStorage.getItem('total_' + currentTraining);
  if (!cont) cont = '0';
  localStorage.setItem('total_' + currentTraining, parseInt(cont) + num);
}

// pose methods:

async function initPoseAndWebcam() {
  UI.cameraLoading();

  const modelURL = Settings.URL_POSE_MODEL + 'model.json';
  const metadataURL = Settings.URL_POSE_MODEL + 'metadata.json';

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  poseModel = await tmPose.load(modelURL, metadataURL);

  // Convenience function to setup a webcam
  webcam = new tmPose.Webcam(Settings.WEBCAM_WIDTH, Settings.WEBCAM_HEIGHT, true); // w, h, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  UI.cameraLoaded();

  painter = new BodyPainter('canvas', Settings.WEBCAM_WIDTH,
                            Settings.WEBCAM_HEIGHT, Settings.MIN_PART_CONFIDENCE);

  SimplePoseDetection.minPartConfidence = Settings.MIN_PART_CONFIDENCE;
}

async function loop(timestamp) {
  if (webcam) {
    webcam.update(); // update the webcam frame
    await predictAndDrawPose();
    window.requestAnimationFrame(loop);
  }
}

async function predictAndDrawPose() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await poseModel.estimatePose(webcam.canvas);

  manualPosePrediction(pose);

  painter.drawPose(pose, webcam);
}

function manualPosePrediction(pose) {
  if (!pose) {
    return;
  }
  if (currentTraining == 'surfing') {
    if (currentPose != 'gymUp' && SimplePoseDetection.isGymUp(pose)) {
      poseDetectedHandler('gymUp', 'Move your arms down');
    } else if (currentPose != 'gymDown' && SimplePoseDetection.isGymDown(pose)) {
      poseDetectedHandler('gymDown', 'Move your arms up');
    }
  } else if (currentTraining == 'gym') {
    if (currentPose != 'liftweightsUp' && SimplePoseDetection.isWeightsUp(pose)) {
      poseDetectedHandler('liftweightsUp', 'Move the weights down');
    } else if (currentPose != 'liftweightsDown' && SimplePoseDetection.isWeightsDown(pose)) {
      poseDetectedHandler('liftweightsDown', 'Move the weights up');
    }
  } else if (currentTraining == 'yoga' && SimplePoseDetection.isTreeFigure(pose)) {
    SoundEffects.applause();
    updateStatsCurrentTraining(1);
    goTo('stats');
  }
}

function poseDetectedHandler(newPose, message) {
  SoundEffects.ding();
  currentPose = newPose;

  painter.postureCounter += 1;

  updateStatsCurrentTraining(1);

  motivationInProgress();

  UI.updateTextTraining(message, painter.postureCounter);

  if (painter.isExerciseCompleted()) {
    SoundEffects.applause();
    goTo('stats');
  }
}

function motivationInProgress() {
  if (painter.isSixPackUnlocked()) {
    if (!VoiceClone.currentAudioVoice) Voice.speak('Perfect, you are improving your six pack. Look it! Continues until 20 repetitions.');
    else speakWithAudioVoice('perfect');
  } else if (painter.isPartialGoal()) {
    if (!VoiceClone.currentAudioVoice) Voice.speak('cheer up!');
    else speakWithAudioVoice('cheerup');
  }
}

window.showGenericModal = UI.showGenericModal;

window.addEventListener('load', init);