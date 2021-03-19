// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI41_0_0EXCameraType) {
  ABI41_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI41_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI41_0_0EXBarCodeScannerModule : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer>

@end
