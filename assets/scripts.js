// Fitness Voice
// Created by javiercampos.es
// 2020-09-04

const URL_BASE = 'http://localhost:5500/';
const URL_MODEL = URL_BASE + "assets/coach-audio-model/";
const HOTWORD = 'coach';
const HOTWORD_ACCURACY = 0.70;
const LANG = 'en-US';
const WIT_TOKEN = '<MY TOKEN HERE :)>';
let currentVoice = null;
let recognizer;
var synth = window.speechSynthesis;

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

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


    // TODO: debug
    $.ajax({
      url: 'https://api.wit.ai/message?v=20200902&q=' + msg,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${WIT_TOKEN}`
      },
      success: function (result) {
        // CallBack(result);
        alert('hello world' + JSON.stringify(result));
      },
      error: function (error) {
        alert('error' + JSON.stringify(error));
      }
    });
  }
}

function listenHotwordOffline() {
  micAnimationPause();

  recognizer.listen(result => {
    const scores = result.scores; // probability of prediction for each class
    const classLabels = recognizer.wordLabels();
    for (let i = 0; i < classLabels.length; i++) {
      if (classLabels[i] == HOTWORD && result.scores[i].toFixed(2) >= HOTWORD_ACCURACY) {
        const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);

        document.querySelector('#lottiemic').play();

        recognizer.stopListening();
        testSpeech();

        break;
      }
    }
  }, {
    includeSpectrogram: true, // in case listen should return result.spectrogram
    probabilityThreshold: 0.75,
    invokeCallbackOnNoiseAndUnknown: true,
    overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
  });
}

function micAnimationPause() {
  const m = document.querySelector('#lottiemic');
  m.pause();
  m.seek('50%');
}

async function init() {
  micAnimationPause();
  $("#helpModal").modal();

  currentVoice = selectVoice(LANG);

  recognizer = await createModel();

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
    showGenericModal('Speech received: ' + speechResult);
    speak(speechResult);

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
