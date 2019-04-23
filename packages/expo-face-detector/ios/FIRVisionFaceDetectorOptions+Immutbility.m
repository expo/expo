//
//  FIRVisionFaceDetectorOptions+Extension.m
//  EXFaceDetector
//
//  Created by Michał Czernek on 19/04/2019.
//

#import "FIRVisionFaceDetectorOptions+Immutbility.h"

@implementation FIRVisionFaceDetectorOptions (Immutbility)

- (BOOL)optionsChanged:(FIRVisionFaceDetectorOptions*)options
{
  return options.performanceMode == self.performanceMode &&
  options.classificationMode == self.classificationMode &&
  options.contourMode == self.contourMode &&
  options.minFaceSize == self.minFaceSize &&
  options.landmarkMode == self.landmarkMode &&
  options.trackingEnabled == self.trackingEnabled;
}

- (id)createCopy
{
  FIRVisionFaceDetectorOptions* options = [FIRVisionFaceDetectorOptions new];
  options.performanceMode = self.performanceMode;
  options.classificationMode = self.classificationMode;
  options.contourMode = self.contourMode;
  options.minFaceSize = self.minFaceSize;
  options.landmarkMode = self.landmarkMode;
  options.trackingEnabled = self.trackingEnabled;
  return options;
}

@end
