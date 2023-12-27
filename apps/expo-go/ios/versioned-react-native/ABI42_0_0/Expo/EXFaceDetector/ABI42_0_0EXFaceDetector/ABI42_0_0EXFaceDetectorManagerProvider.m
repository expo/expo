// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceDetectorManagerProvider.h>
#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceDetectorManager.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFaceDetectorManagerProviderInterface.h>

@implementation ABI42_0_0EXFaceDetectorManagerProvider

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI42_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI42_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI42_0_0EXFaceDetectorManager alloc] init];
}

@end
