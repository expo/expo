// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXBarcodeScannerInterface.h>

typedef NS_ENUM(NSInteger, ABI49_0_0EXCameraType) {
  ABI49_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI49_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

@interface ABI49_0_0EXBarCodeScanner : NSObject <ABI49_0_0EXBarCodeScannerInterface>

- (void)setSession:(AVCaptureSession *)session;
- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setOnBarCodeScanned:(void (^)(NSDictionary *))onBarCodeScanned;

- (void)setIsEnabled:(BOOL)enabled;
- (void)setSettings:(NSDictionary<NSString *, id> *)settings;

- (void)setPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer;

- (void)maybeStartBarCodeScanning;
- (void)stopBarCodeScanning;

@end
