// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI33_0_0EXCameraType) {
  ABI33_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI33_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI33_0_0EXBarCodeScannerModule : ABI33_0_0UMExportedModule <ABI33_0_0UMModuleRegistryConsumer>

@end
