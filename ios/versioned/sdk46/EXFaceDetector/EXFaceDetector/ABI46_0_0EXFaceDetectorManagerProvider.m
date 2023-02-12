// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXFaceDetector/ABI46_0_0EXFaceDetectorManagerProvider.h>
#import <ABI46_0_0EXFaceDetector/ABI46_0_0EXFaceDetectorManager.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFaceDetectorManagerProviderInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>

@implementation ABI46_0_0EXFaceDetectorManagerProvider

ABI46_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI46_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI46_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI46_0_0EXFaceDetectorManager alloc] init];
}

@end
