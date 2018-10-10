// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, EXCameraType) {
  EXCameraTypeFront = AVCaptureDevicePositionFront,
  EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface EXBarCodeScannerModule : EXExportedModule <EXModuleRegistryConsumer>

@end
