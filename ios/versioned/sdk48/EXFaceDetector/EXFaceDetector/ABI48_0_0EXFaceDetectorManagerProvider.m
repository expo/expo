// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXFaceDetector/ABI48_0_0EXFaceDetectorManagerProvider.h>
#import <ABI48_0_0EXFaceDetector/ABI48_0_0EXFaceDetectorManager.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFaceDetectorManagerProviderInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDefines.h>

@implementation ABI48_0_0EXFaceDetectorManagerProvider

ABI48_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI48_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI48_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI48_0_0EXFaceDetectorManager alloc] init];
}

@end
