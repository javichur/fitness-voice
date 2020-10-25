// Fitness Voice
// Created by javiercampos.es

var typedAnimation = null;
function initUI() {
  micAnimationPause();
  $('#divStats').hide();
  $('#divTraining').hide();

  if (!typedAnimation) {
    typedAnimation = new Typed("#lblSampleUtterance", {
      stringsElement: '#typed-strings',
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 500,
      startDelay: 1000,
      loop: true,
    });
  }

  $('#helpModal').modal();
}

function showGenericModal(txt) {
  document.querySelector('#genericModalTitle').textContent = '🎙️ Fitness Voice';
  document.querySelector('#genericModalTxt').textContent = txt;
  $("#genericModal").modal();
};

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
    if (!gym) gym = 0;

    let surf = localStorage.getItem("total_surfing");
    if (!surf) surf = 0;

    let yoga = localStorage.getItem("total_yoga");
    if (!yoga) yoga = 0;

    ret = 'Keep training every week. Your stats are the following: ' + gym + ' moves. Surfing stats: ' + surf + ' moves. Total yoga: ' + yoga + ' moves.';

    $("#divStats").show();

    var ctxChart = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctxChart, {
      type: 'bar',
      data: {
        labels: ['Gym movements', 'Surf movements', 'Yoga movements'],
        datasets: [{
          data: [gym, surf, yoga],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        legend: false,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
            }
          }]
        }
      }
    });
  } else {
    ret = 'Your statistics are not available. You must give the browser permission to store information.';
  }

  return ret;
}

function cameraLoading() {
  document.querySelector('#lottiecameraloading').play();
  $('#lottiecameraloading').show();
}

function cameraLoaded() {
  $("#divCanvasCam").css("opacity", "1");
  $('#lottiecameraloading').hide();
  document.querySelector('#lottiecameraloading').pause();
  document.querySelector('#lblCounter').textContent = 0;
}

export { showGenericModal, micAnimationPause, micAnimationPlay, getStats, initUI, cameraLoading, cameraLoaded };