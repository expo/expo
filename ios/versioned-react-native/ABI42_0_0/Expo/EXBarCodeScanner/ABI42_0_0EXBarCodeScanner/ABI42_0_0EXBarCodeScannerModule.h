// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI42_0_0EXCameraType) {
  ABI42_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI42_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI42_0_0EXBarCodeScannerModule : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer>

@end
