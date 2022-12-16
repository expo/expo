// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI45_0_0EXCameraType) {
  ABI45_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI45_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI45_0_0EXBarCodeScannerModule : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer>

@end
