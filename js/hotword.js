// Fitness Voice
// Created by javiercampos.es

import { Settings } from './settings.js';

class HotWord {

  static isIdle = true; // solo escuchar hotword si el user no está diciendo un comando.

  static handlerHotWordDetected = null;

  static recognizerHotwordOffline = null;

  constructor() { }

  static async createHotwordModelIfNotExists() {
    if (!this.recognizerHotwordOffline) {
      const checkpointURL = Settings.URL_HOTWORD_MODEL + 'model.json'; // model topology
      const metadataURL = Settings.URL_HOTWORD_MODEL + 'metadata.json'; // model metadata

      this.recognizerHotwordOffline = speechCommands.create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL);

      // check that model and metadata are loaded via HTTPS requests.
      await this.recognizerHotwordOffline.ensureModelLoaded();
    }
  }

  static listenHotwordOffline() {
    if (!this.recognizerHotwordOffline.isListening()) {
      this.recognizerHotwordOffline.listen(result => {
        console.log('recognizerHotwordOffline.listen');
        if (this.isIdle) {
          console.log('recognizerHotwordOffline.listen isListening');
          const classLabels = this.recognizerHotwordOffline.wordLabels();
          for (let i = 0; i < classLabels.length; i++) {
            if (classLabels[i] == Settings.HOTWORD && result.scores[i].toFixed(2) >= Settings.HOTWORD_ACCURACY) {
              this.isIdle = false;

              if (this.handlerHotWordDetected != null) {
                this.handlerHotWordDetected();
              }
              break;
            }
          }
        }
      }, {
        includeSpectrogram: true,
        probabilityThreshold: Settings.HOTWORD_ACCURACY,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50,
      });
    }
  }
}

export { HotWord };

