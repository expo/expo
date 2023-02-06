// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXBarcodeScannerInterface.h>

typedef NS_ENUM(NSInteger, ABI48_0_0EXCameraType) {
  ABI48_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI48_0_0EXCameraTypeBack = AVCaptureDevicePositionBack
};

@interface ABI48_0_0EXBarCodeScanner : NSObject <ABI48_0_0EXBarCodeScannerInterface>

- (void)setSession:(AVCaptureSession *)session;
- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setOnBarCodeScanned:(void (^)(NSDictionary *))onBarCodeScanned;

- (void)setIsEnabled:(BOOL)enabled;
- (void)setSettings:(NSDictionary<NSString *, id> *)settings;

- (void)setPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer;

- (void)maybeStartBarCodeScanning;
- (void)stopBarCodeScanning;

@end
