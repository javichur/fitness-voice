const Settings = {
  // URL_BASE: 'https://javiercampos.es/projects/fitnessvoice/',
  URL_BASE: 'http://localhost:5500/',

  HOTWORD: 'coach',
  HOTWORD_ACCURACY: 0.60,
  LANG: 'en-US',
  URL_HOTWORD_MODEL: null, // filled below

  WIT_TOKEN: '36XCICQUNDFMFIOXGXDILBBARBVU7IY3',
  WIT_VERSION: '20200902',
  WIT_ACCURACY: 0.7,

  MIN_PART_CONFIDENCE: 0.4, // pose confidence
  URL_POSE_MODEL: './my_model_pose/',

  WEBCAM_HEIGHT: 600,
  WEBCAM_WIDTH: 800,
}
Settings.URL_HOTWORD_MODEL = Settings.URL_BASE + 'assets/coach-audio-model/';

export { Settings };