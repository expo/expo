// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI32_0_0EXCameraType) {
  ABI32_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI32_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI32_0_0EXBarCodeScannerModule : ABI32_0_0EXExportedModule <ABI32_0_0EXModuleRegistryConsumer>

@end
