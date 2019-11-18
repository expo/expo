// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI36_0_0EXCameraType) {
  ABI36_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI36_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI36_0_0EXBarCodeScannerModule : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer>

@end
