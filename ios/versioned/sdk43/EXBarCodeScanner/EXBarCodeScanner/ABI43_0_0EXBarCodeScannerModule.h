// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI43_0_0EXCameraType) {
  ABI43_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI43_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI43_0_0EXBarCodeScannerModule : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer>

@end
