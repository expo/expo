// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI30_0_0EXCameraType) {
  ABI30_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI30_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI30_0_0EXBarCodeScannerModule : ABI30_0_0EXExportedModule <ABI30_0_0EXModuleRegistryConsumer>

@end
