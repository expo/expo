// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <EDUMExportedModule.h>
#import <EDUMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, EDEXCameraType) {
  EDEXCameraTypeFront = AVCaptureDevicePositionFront,
  EDEXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface EDEXBarCodeScannerModule : EDUMExportedModule <EDUMModuleRegistryConsumer>

@end
