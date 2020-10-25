
// Fitness Voice
// Created by javiercampos.es

export class Voice {
  static currentVoice = null; // synthetic voice
  static synth = window.speechSynthesis;
  static lang = null;

  static selectVoice(lang) {
    this.lang = lang;
    const voices = this.synth.getVoices();
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].lang === lang) {
        return voices[i];
      }
    }
  }

  static speak(msg) {
    if (this.synth.speaking) {
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

      utterThis.lang = this.lang;
      utterThis.voice = this.currentVoice;
      // utterThis.volume = 1;
      utterThis.text = msg;
      utterThis.pitch = 1;
      utterThis.rate = 1;

      this.synth.speak(utterThis);
    }
  }
}