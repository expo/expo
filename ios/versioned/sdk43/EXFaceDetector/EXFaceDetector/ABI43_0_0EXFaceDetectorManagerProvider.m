// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXFaceDetector/ABI43_0_0EXFaceDetectorManagerProvider.h>
#import <ABI43_0_0EXFaceDetector/ABI43_0_0EXFaceDetectorManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFaceDetectorManagerProviderInterface.h>

@implementation ABI43_0_0EXFaceDetectorManagerProvider

ABI43_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI43_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI43_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI43_0_0EXFaceDetectorManager alloc] init];
}

@end
