//
//  ABI24_0_0EXFaceDetectorStub.m
//  Exponent
//
//  Created by Stanisław Chmiela on 17.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "ABI24_0_0EXFaceDetectorManagerStub.h"
#import <ReactABI24_0_0/ABI24_0_0RCTLog.h>

static NSString * const ABI24_0_0EXFaceDetectionHasBeenStubbedMessage = @"Face detection has not been included in this build.";

@implementation ABI24_0_0EXFaceDetectorManagerStub

- (NSDictionary *)constantsToExport {
  return @{@"Mode" : @{},
           @"Landmarks" : @{},
           @"Classifications" : @{}};
}

- (instancetype)initWithSessionQueue:(dispatch_queue_t)sessionQueue delegate:(id <ABI24_0_0EXFaceDetectorDelegate>)delegate {
  self = [super init];
  return self;
}

- (void)setIsEnabled:(id)json { }
- (void)setLandmarksDetected:(id)json { }
- (void)setClassificationsDetected:(id)json { }
- (void)setMode:(id)json { }

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer {
  ABI24_0_0RCTLogWarn(ABI24_0_0EXFaceDetectionHasBeenStubbedMessage);
}
- (void)stopFaceDetection { }

@end

