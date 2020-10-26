
// Fitness Voice
// Created by javiercampos.es

export class VoiceClone {
  static currentAudioVoice = null; // clone based voice (Bill, Her, Morgan, Joker...).

  static speakWithAudioVoice(key) {
    if (this.currentAudioVoice) {
      var audio = new Audio(`./assets/audios/${this.currentAudioVoice}-${key}.mp3`);
      audio.play();
    }
  }

  static isValidVoiceName(person) {
    if (person) {
      person = person.toLowerCase();
    }
    return person == 'bill' ||
      person == 'her' ||
      person == 'joker' ||
      person == 'morgan' ||
      person == 'morpheus' ||
      person == 'yellow';
  }
}