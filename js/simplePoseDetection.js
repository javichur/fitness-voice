// Fitness Voice
// Created by javiercampos.es

import { BodyPoints as B } from './bodyPoints.js';

export class SimplePoseDetection {
  static minPartConfidence = 1;

  constructor() { }

  static isGymUp(pose) {
    if (this.hasArmsConcidence(pose) &&
      pose.keypoints[B.leftElbow].position.y <= pose.keypoints[B.leftShoulder].position.y &&
      pose.keypoints[B.leftWrist].position.y <= pose.keypoints[B.leftElbow].position.y &&
      pose.keypoints[B.rightElbow].position.y <= pose.keypoints[B.rightShoulder].position.y &&
      pose.keypoints[B.rightWrist].position.y <= pose.keypoints[B.rightElbow].position.y)
      return true;
    return false;
  }

  static isGymDown(pose) {
    if (this.hasArmsConcidence(pose) &&
      pose.keypoints[B.leftHip].position.y <= pose.keypoints[B.leftWrist].position.y &&
      pose.keypoints[B.rightHip].position.y <= pose.keypoints[B.rightWrist].position.y)
      return true;
    return false;
  }

  static DISTANCE_ACCURACY = 100;
  static isWeightsUp(pose) {
    if (this.hasArmsConcidence(pose) &&
      pose.keypoints[B.leftElbow].position.y >= pose.keypoints[B.leftShoulder].position.y &&
      pose.keypoints[B.rightElbow].position.y >= pose.keypoints[B.rightShoulder].position.y &&
      pose.keypoints[B.rightWrist].position.y <= pose.keypoints[B.rightElbow].position.y) {
      const difLeft = (pose.keypoints[B.leftWrist].position.y - pose.keypoints[B.leftShoulder].position.y);
      const difRight = (pose.keypoints[B.rightWrist].position.y - pose.keypoints[B.rightShoulder].position.y);

      return (Math.sqrt(difLeft * difLeft) < this.DISTANCE_ACCURACY) &&
        (Math.sqrt(difRight * difRight) < this.DISTANCE_ACCURACY);
    }
    return false;
  }

  static isWeightsDown(pose) {
    if (this.hasArmsConcidence(pose) &&
      pose.keypoints[B.leftHip].position.y <= pose.keypoints[B.leftWrist].position.y &&
      pose.keypoints[B.rightHip].position.y <= pose.keypoints[B.rightWrist].position.y) {
      const difLeft = (pose.keypoints[B.leftWrist].position.y - pose.keypoints[B.leftHip].position.y);
      const difRight = (pose.keypoints[B.rightWrist].position.y - pose.keypoints[B.rightHip].position.y);

      return (Math.sqrt(difLeft * difLeft) < this.DISTANCE_ACCURACY) &&
        (Math.sqrt(difRight * difRight) < this.DISTANCE_ACCURACY);
    }
    return false;
  }

  static hasArmsConcidence(pose) {
    if (pose.keypoints[B.leftElbow].score >= this.minPartConfidence &&
      pose.keypoints[B.leftShoulder].score >= this.minPartConfidence &&
      pose.keypoints[B.leftWrist].score >= this.minPartConfidence &&
      pose.keypoints[B.rightElbow].score >= this.minPartConfidence &&
      pose.keypoints[B.rightShoulder].score >= this.minPartConfidence &&
      pose.keypoints[B.rightElbow].score >= this.minPartConfidence) {
        return true;
      }
      return false;
  }

  static DISTANCE_ACCURACY_YOGA = 80;
  static isTreeFigure(pose) {
    if (this.hasArmsConcidence(pose) &&
      pose.keypoints[B.leftAnkle].score >= this.minPartConfidence &&
      pose.keypoints[B.leftKnee].score >= this.minPartConfidence &&
      pose.keypoints[B.rightKnee].score >= this.minPartConfidence &&
      pose.keypoints[B.leftEye].score >= this.minPartConfidence &&
      pose.keypoints[B.rightEye].score >= this.minPartConfidence &&
      pose.keypoints[B.leftWrist].position.y <= pose.keypoints[B.leftEye].position.y &&
      pose.keypoints[B.rightWrist].position.y <= pose.keypoints[B.rightEye].position.y) {
      const difHandsX = (pose.keypoints[B.leftWrist].position.x - pose.keypoints[B.rightWrist].position.x);
      const difHandsY = (pose.keypoints[B.leftWrist].position.y - pose.keypoints[B.rightWrist].position.y);

      const difAnkleX = (pose.keypoints[B.leftAnkle].position.x - pose.keypoints[B.rightKnee].position.x);
      const difAnkleY = (pose.keypoints[B.leftAnkle].position.y - pose.keypoints[B.rightKnee].position.y);

      return (Math.sqrt(difHandsX * difHandsX) < this.DISTANCE_ACCURACY_YOGA) &&
        (Math.sqrt(difHandsY * difHandsY) < this.DISTANCE_ACCURACY_YOGA) &&
        (Math.sqrt(difAnkleX * difAnkleX) < this.DISTANCE_ACCURACY_YOGA) &&
        (Math.sqrt(difAnkleY * difAnkleY) < this.DISTANCE_ACCURACY_YOGA);
    }
    return false;
  }
}