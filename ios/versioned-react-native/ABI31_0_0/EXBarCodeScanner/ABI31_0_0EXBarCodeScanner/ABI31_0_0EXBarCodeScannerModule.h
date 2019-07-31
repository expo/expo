// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI31_0_0EXCameraType) {
  ABI31_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI31_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI31_0_0EXBarCodeScannerModule : ABI31_0_0EXExportedModule <ABI31_0_0EXModuleRegistryConsumer>

@end
