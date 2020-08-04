// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI37_0_0EXCameraType) {
  ABI37_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI37_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI37_0_0EXBarCodeScannerModule : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer>

@end
