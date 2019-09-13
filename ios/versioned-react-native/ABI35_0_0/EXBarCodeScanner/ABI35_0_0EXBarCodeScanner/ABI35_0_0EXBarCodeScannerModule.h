// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI35_0_0EXCameraType) {
  ABI35_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI35_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI35_0_0EXBarCodeScannerModule : ABI35_0_0UMExportedModule <ABI35_0_0UMModuleRegistryConsumer>

@end
