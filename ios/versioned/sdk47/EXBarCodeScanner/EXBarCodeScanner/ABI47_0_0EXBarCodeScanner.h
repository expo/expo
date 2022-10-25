// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXBarCodeScannerInterface.h>

@interface ABI47_0_0EXBarCodeScanner : NSObject <ABI47_0_0EXBarCodeScannerInterface>

- (void)setSession:(AVCaptureSession *)session;
- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setOnBarCodeScanned:(void (^)(NSDictionary *))onBarCodeScanned;

- (void)setIsEnabled:(BOOL)enabled;
- (void)setSettings:(NSDictionary<NSString *, id> *)settings;

- (void)setPreviewLayer:(AVCaptureVideoPreviewLayer *)previewLayer;

- (void)maybeStartBarCodeScanning;
- (void)stopBarCodeScanning;

@end
