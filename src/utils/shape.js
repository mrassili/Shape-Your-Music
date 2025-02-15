import { dist } from './math';

const isBetween = (val, a, b) => val >= a && val <= b;

export const getAngle = (p1, p2, p3) => {
  const atanA = Math.atan2(p1.x - p2.x, p1.y - p2.y);
  const atanC = Math.atan2(p3.x - p2.x, p3.y - p2.y);
  let diff = atanA - atanC;
  diff = (diff * 180) / Math.PI;
  return diff;
};

export const thetaToScaleDegree = (theta, scaleObj) => {
  if (theta < 0) {
    theta = theta + 360;
  }

  if (theta > 180) {
    theta = theta - 360;
  }

  // right turn or left turn
  const negMult = theta < 0 ? 1 : -1;
  const absTheta = Math.abs(theta);

  // find sector
  const notesInScale = scaleObj.simple().length - 1;
  const dTheta = 180 / notesInScale;
  let lowerBound = 0;
  let upperBound = dTheta;

  let degreeDiff = 0;
  for (let i = notesInScale; i > 0; i--) {
    if (isBetween(absTheta, lowerBound, upperBound)) {
      degreeDiff = i * negMult;
      break;
    }
    lowerBound = upperBound;
    upperBound += dTheta;
  }
  return degreeDiff;
};

export const getPerimeterLength = points => {
  let len = 0;
  const n = points.length;

  for (let i = 2; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    const prevX = points[i - 2];
    const prevY = points[i - 1];
    len += dist(x, y, prevX, prevY);
  }

  // last edge
  len += dist(points[0], points[1], points[n - 2], points[n - 1]);
  return len;
};

export const getAveragePoint = points => {
  let totalX = 0;
  let totalY = 0;

  for (let i = 0; i < points.length; i += 2) {
    totalX += points[i];
    totalY += points[i + 1];
  }

  return {
    x: totalX / (points.length / 2),
    y: totalY / (points.length / 2),
  };
};

export const forEachPoint = (points, callback) => {
  for (var i = 0; i < points.length; i += 2) {
    let p = {
      x: points[i],
      y: points[i + 1],
    };
    callback(p, i);
  }
};
