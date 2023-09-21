var TouchHistoryMath = {
  centroidDimension: function centroidDimension(touchHistory, touchesChangedAfter, isXAxis, ofCurrent) {
    var touchBank = touchHistory.touchBank;
    var total = 0;
    var count = 0;
    var oneTouchData = touchHistory.numberActiveTouches === 1 ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch] : null;
    if (oneTouchData !== null) {
      if (oneTouchData.touchActive && oneTouchData.currentTimeStamp > touchesChangedAfter) {
        total += ofCurrent && isXAxis ? oneTouchData.currentPageX : ofCurrent && !isXAxis ? oneTouchData.currentPageY : !ofCurrent && isXAxis ? oneTouchData.previousPageX : oneTouchData.previousPageY;
        count = 1;
      }
    } else {
      for (var i = 0; i < touchBank.length; i++) {
        var touchTrack = touchBank[i];
        if (touchTrack !== null && touchTrack !== undefined && touchTrack.touchActive && touchTrack.currentTimeStamp >= touchesChangedAfter) {
          var toAdd = void 0;
          if (ofCurrent && isXAxis) {
            toAdd = touchTrack.currentPageX;
          } else if (ofCurrent && !isXAxis) {
            toAdd = touchTrack.currentPageY;
          } else if (!ofCurrent && isXAxis) {
            toAdd = touchTrack.previousPageX;
          } else {
            toAdd = touchTrack.previousPageY;
          }
          total += toAdd;
          count++;
        }
      }
    }
    return count > 0 ? total / count : TouchHistoryMath.noCentroid;
  },
  currentCentroidXOfTouchesChangedAfter: function currentCentroidXOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, true, true);
  },
  currentCentroidYOfTouchesChangedAfter: function currentCentroidYOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, false, true);
  },
  previousCentroidXOfTouchesChangedAfter: function previousCentroidXOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, true, false);
  },
  previousCentroidYOfTouchesChangedAfter: function previousCentroidYOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(touchHistory, touchesChangedAfter, false, false);
  },
  currentCentroidX: function currentCentroidX(touchHistory) {
    return TouchHistoryMath.centroidDimension(touchHistory, 0, true, true);
  },
  currentCentroidY: function currentCentroidY(touchHistory) {
    return TouchHistoryMath.centroidDimension(touchHistory, 0, false, true);
  },
  noCentroid: -1
};
module.exports = TouchHistoryMath;