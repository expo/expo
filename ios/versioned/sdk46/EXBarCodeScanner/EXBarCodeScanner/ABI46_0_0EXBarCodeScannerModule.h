// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI46_0_0EXCameraType) {
  ABI46_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI46_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI46_0_0EXBarCodeScannerModule : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer>

@end
