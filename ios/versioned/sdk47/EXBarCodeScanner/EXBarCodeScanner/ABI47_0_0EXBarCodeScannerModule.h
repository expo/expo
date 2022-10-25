// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI47_0_0EXCameraType) {
  ABI47_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI47_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI47_0_0EXBarCodeScannerModule : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer>

@end
