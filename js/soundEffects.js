// Fitness Voice
// Created by javiercampos.es

function ding() {
  var audio = new Audio('./assets/ding.mp3');
  audio.play();
}

function applause() {
  var audio = new Audio('./assets/cheer.mp3');
  audio.play();
}

export { ding, applause };