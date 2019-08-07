// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@protocol UMFaceDetectorManager

- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setIsEnabled:(BOOL)enabled;
- (void)setOnFacesDetected:(void (^)(NSArray<NSDictionary *> *))onFacesDetected;

- (void)updateSettings:(NSDictionary *)settings;
- (void)updateMirrored:(BOOL) mirrored;

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer;
- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer mirrored:(BOOL) mirrored;
- (void)stopFaceDetection;

@end
