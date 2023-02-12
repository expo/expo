//
//  ABI48_0_0EXFaceDetectorManager.h
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <AVFoundation/AVFoundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFaceDetectorManagerInterface.h>

@interface ABI48_0_0EXFaceDetectorManager : NSObject <ABI48_0_0EXFaceDetectorManagerInterface>

- (void)setOnFacesDetected:(void (^)(NSArray<NSDictionary *> *))onFacesDetected;

- (void)setIsEnabled:(BOOL)enabled;
- (void)updateSettings:(NSDictionary *)settings;

- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session
                        withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer;
- (void)maybeStartFaceDetectionOnSession:(AVCaptureSession *)session
                        withPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer mirrored:(BOOL)mirrored;
- (void)stopFaceDetection;

@end
