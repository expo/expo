// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI34_0_0EXCameraType) {
  ABI34_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI34_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI34_0_0EXBarCodeScannerModule : ABI34_0_0UMExportedModule <ABI34_0_0UMModuleRegistryConsumer>

@end
