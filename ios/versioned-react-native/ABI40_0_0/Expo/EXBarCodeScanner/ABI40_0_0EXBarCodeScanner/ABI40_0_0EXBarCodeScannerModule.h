// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI40_0_0EXCameraType) {
  ABI40_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI40_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI40_0_0EXBarCodeScannerModule : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer>

@end
