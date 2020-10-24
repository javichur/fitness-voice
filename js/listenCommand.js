// Fitness Voice
// Created by javiercampos.es

import { Settings } from './settings.js';

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

class ListenCommand {

  static handlerlistened = null;
  static handlerEnd = null;

  static testSpeech() {
    // var grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + phrase +';';
    var recognition = new SpeechRecognition();
    // var speechRecognitionList = new SpeechGrammarList();
    // speechRecognitionList.addFromString(grammar, 1);
    // recognition.grammars = speechRecognitionList;
    recognition.lang = Settings.LANG;
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
     
      if (ListenCommand.handlerlistened) {
        ListenCommand.handlerlistened(speechResult);
      }

      console.log('Confidence: ' + event.results[0][0].confidence);
  
      recognition.stop(); // debug revisar
  
      ListenCommand.transitionToIdle();
    };
  
    recognition.onspeechend = function () {
      recognition.stop();
      ListenCommand.transitionToIdle();
    }
  
    recognition.onerror = function (event) {
      console.log('SpeechRecognition.onerror');

      ListenCommand.transitionToIdle();
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

      ListenCommand.transitionToIdle();
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

  static transitionToIdle() {
    if (this.handlerEnd) {
      this.handlerEnd();
    }
  }
}

export { ListenCommand };