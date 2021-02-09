// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI38_0_0EXCameraType) {
  ABI38_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI38_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI38_0_0EXBarCodeScannerModule : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

@end
