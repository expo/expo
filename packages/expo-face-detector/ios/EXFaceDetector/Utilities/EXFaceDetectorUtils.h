//
//  EXFaceDetectorUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <GoogleMVDataOutput/GoogleMVDataOutput.h>

typedef NS_ENUM(NSInteger, EXFaceDetectionMode) {
  EXFaceDetectionFastMode = GMVDetectorFaceFastMode,
  EXFaceDetectionAccurateMode = GMVDetectorFaceAccurateMode
};

typedef NS_ENUM(NSInteger, EXFaceDetectionLandmarks) {
  EXFaceDetectAllLandmarks = GMVDetectorFaceLandmarkAll,
  EXFaceDetectNoLandmarks = GMVDetectorFaceLandmarkNone
};

typedef NS_ENUM(NSInteger, EXFaceDetectionClassifications) {
  EXFaceRunAllClassifications = GMVDetectorFaceClassificationAll,
  EXFaceRunNoClassifications = GMVDetectorFaceClassificationNone
};

@interface EXFaceDetectorUtils : NSObject

+ (NSDictionary *)constantsToExport;

+ (AVCaptureVideoOrientation)videoOrientationForDeviceOrientation:(UIDeviceOrientation)orientation;

+ (CGAffineTransform)transformFromDeviceOutput:(GMVDataOutput *)dataOutput toInterfaceVideoOrientation:(AVCaptureVideoOrientation)interfaceVideoOrientation;

@end
