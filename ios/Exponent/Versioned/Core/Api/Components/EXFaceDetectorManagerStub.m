//
//  EXFaceDetectorStub.m
//  Exponent
//
//  Created by Stanisław Chmiela on 17.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "EXFaceDetectorManagerStub.h"
#import <React/RCTLog.h>

static NSString * const EXFaceDetectionHasBeenStubbedMessage = @"Face detection has not been included in this build.";

@implementation EXFaceDetectorManagerStub

- (NSDictionary *)constantsToExport {
  return [[self class] constants];
}

+ (NSDictionary *)constants {
  return @{@"Mode" : @{},
           @"Landmarks" : @{},
           @"Classifications" : @{}};
}

- (instancetype)initWithSessionQueue:(dispatch_queue_t)sessionQueue delegate:(id <EXFaceDetectorDelegate>)delegate {
  self = [super init];
  return self;
}

- (void)setIsEnabled:(id)json { }
- (void)setLandmarksDetected:(id)json { }
- (void)setClassificationsDetected:(id)json { }
- (void)setMode:(id)json { }

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer {
  RCTLogWarn(EXFaceDetectionHasBeenStubbedMessage);
}
- (void)stopFaceDetection { }

@end

