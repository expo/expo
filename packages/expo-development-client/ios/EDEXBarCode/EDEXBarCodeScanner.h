// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
//#import <EDUMBarCodeScannerInterface.h>

@interface EDEXBarCodeScanner : NSObject

- (void)setSession:(AVCaptureSession *)session;
- (void)setSessionQueue:(dispatch_queue_t)sessionQueue;
- (void)setOnBarCodeScanned:(void (^)(NSDictionary *))onBarCodeScanned;

- (void)setIsEnabled:(BOOL)enabled;
- (void)setSettings:(NSDictionary<NSString *, id> *)settings;

- (void)maybeStartBarCodeScanning;
- (void)stopBarCodeScanning;

@end
