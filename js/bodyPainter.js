// Fitness Voice
// Created by javiercampos.es

import { BodyPoints as B } from './bodyPoints.js';

export class BodyPainter {
  postureCounter = 0;
  ctx = null;
  minPartConfidence = 0;

  constructor(canvas, confidence) {
    this.ctx = canvas.getContext("2d");
    this.minPartConfidence = confidence;
  }

  drawPose(pose, webcam) {
    if (webcam.canvas) {
      this.ctx.drawImage(webcam.canvas, 0, 0);

      // draw the keypoints and skeleton
      if (pose) {
        this.myDrawSkeleton(pose);
        this.myDrawKeyPoints(pose);
      }
    }
  }

  myDrawKeyPoints(pose) {
    // tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      if (keypoint.score >= this.minPartConfidence) {
        this.drawPoint(keypoint.position, 'orange');
      }
    }
  }

  myDrawSkeleton(pose) {

    // head size (aprox)
    var a = pose.keypoints[B.nose].position.x - pose.keypoints[B.leftEye].position.x;
    var b = pose.keypoints[B.nose].position.y - pose.keypoints[B.leftEye].position.y;
    var c = Math.sqrt(a * a + b * b) * 2;

    var circle = new Path2D();
    circle.arc(pose.keypoints[B.nose].position.x, pose.keypoints[B.nose].position.y, c, 0, 2 * Math.PI);
    this.ctx.fillStyle = 'pink';
    this.ctx.fill(circle);

    this.drawLineFromKeypoints(pose.keypoints, B.leftShoulder, B.rightShoulder, '#2196F3');
    this.drawLineFromKeypoints(pose.keypoints, B.leftShoulder, B.leftHip, '#2196F3');
    this.drawLineFromKeypoints(pose.keypoints, B.rightShoulder, B.rightHip, '#2196F3');
    this.drawLineFromKeypoints(pose.keypoints, B.leftHip, B.rightHip, '#2196F3');

    this.drawLineFromKeypoints(pose.keypoints, B.leftShoulder, B.leftElbow, 'red');
    this.drawLineFromKeypoints(pose.keypoints, B.leftElbow, B.leftWrist, 'red');

    this.drawLineFromKeypoints(pose.keypoints, B.rightShoulder, B.rightElbow, 'red');
    this.drawLineFromKeypoints(pose.keypoints, B.rightElbow, B.rightWrist, 'red');

    this.drawLineFromKeypoints(pose.keypoints, B.leftHip, B.leftKnee, 'green');
    this.drawLineFromKeypoints(pose.keypoints, B.leftKnee, B.leftAnkle, 'green');

    this.drawLineFromKeypoints(pose.keypoints, B.rightHip, B.rightKnee, 'green');
    this.drawLineFromKeypoints(pose.keypoints, B.rightKnee, B.rightAnkle, 'green');

    if (this.postureCounter >= 10) {
      this.drawSixPack(pose.keypoints);
    }
  }

  drawPoint(p, color) {
    var circle = new Path2D();
    circle.arc(p.x, p.y, 10, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill(circle);
  }

  drawLineFromKeypoints(keypoints, a, b, color) {
    if (keypoints[a].score >= this.minPartConfidence && keypoints[b].score >= this.minPartConfidence) {
      this.drawLineFromXY(keypoints[a].position, keypoints[b].position, color);
    }
  }

  drawLineFromXY(a, b, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  drawSixPack(keypoints) {
    const w = {
      x: keypoints[B.rightHip].position.x - keypoints[B.leftHip].position.x,
      y: keypoints[B.rightHip].position.y - keypoints[B.leftHip].position.y,
    }

    const height = {
      x: keypoints[B.leftShoulder].position.x - keypoints[B.leftHip].position.x,
      y: keypoints[B.leftShoulder].position.y - keypoints[B.leftHip].position.y,
    }

    const a = {
      x: keypoints[B.leftHip].position.x + (w.x / 4),
      y: keypoints[B.leftHip].position.y + (w.y / 4),
    };

    const b = {
      x: keypoints[B.leftHip].position.x + (w.x / 4) * 3,
      y: keypoints[B.leftHip].position.y + (w.y / 4) * 3,
    };

    const c = {
      x: a.x + (height.x / 2),
      y: a.y + (height.y / 2),
    };

    const d = {
      x: b.x + (height.x / 2),
      y: b.y + (height.y / 2),
    };

    const e = {
      x: a.x + (b.x - a.x) / 2,
      y: a.y + (b.y - a.y) / 2,
    };
    const f = {
      x: c.x + (d.x - c.x) / 2,
      y: c.y + (d.y - c.y) / 2,
    };

    const g = {
      x: a.x + (c.x - a.x) / 3,
      y: a.y + (c.y - a.y) / 3,
    };
    const h = {
      x: b.x + (d.x - b.x) / 3,
      y: b.y + (d.y - b.y) / 3,
    };

    const i = {
      x: a.x + ((c.x - a.x) / 3) * 2,
      y: a.y + ((c.y - a.y) / 3) * 2,
    };
    const j = {
      x: b.x + ((d.x - b.x) / 3) * 2,
      y: b.y + ((d.y - b.y) / 3) * 2,
    };

    this.drawLineFromXY(a, c, 'red');
    this.drawLineFromXY(b, d, 'red');
    this.drawLineFromXY(c, d, 'red');

    this.drawLineFromXY(e, f, 'red');
    this.drawLineFromXY(g, h, 'red');
    this.drawLineFromXY(i, j, 'red');
  }
}