// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI39_0_0EXCameraType) {
  ABI39_0_0EXCameraTypeFront = AVCaptureDevicePositionFront,
  ABI39_0_0EXCameraTypeBack = AVCaptureDevicePositionBack,
};

@interface ABI39_0_0EXBarCodeScannerModule : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer>

@end
