// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXFaceDetector/ABI45_0_0EXFaceDetectorManagerProvider.h>
#import <ABI45_0_0EXFaceDetector/ABI45_0_0EXFaceDetectorManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXFaceDetectorManagerProviderInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>

@implementation ABI45_0_0EXFaceDetectorManagerProvider

ABI45_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI45_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI45_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI45_0_0EXFaceDetectorManager alloc] init];
}

@end
