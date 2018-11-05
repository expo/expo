// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <ABI30_0_0EXBarCodeScannerInterface/ABI30_0_0EXBarCodeScannerInterface.h>

@interface ABI30_0_0EXBarCodeScanner : NSObject <ABI30_0_0EXBarCodeScannerInterface>

- (void)setSession:(AVCaptureSession *)session;
- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setOnBarCodeScanned:(void (^)(NSDictionary *))onBarCodeScanned;

- (void)setIsEnabled:(BOOL)enabled;
- (void)setSettings:(NSDictionary<NSString *, id> *)settings;

- (void)maybeStartBarCodeScanning;
- (void)stopBarCodeScanning;

@end
