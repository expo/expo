// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI44_0_0EXCameraType) {
  ABI44_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI44_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI44_0_0EXBarCodeScannerModule : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>

@end
