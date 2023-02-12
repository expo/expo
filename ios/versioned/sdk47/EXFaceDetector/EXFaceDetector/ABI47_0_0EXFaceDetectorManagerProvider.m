// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXFaceDetector/ABI47_0_0EXFaceDetectorManagerProvider.h>
#import <ABI47_0_0EXFaceDetector/ABI47_0_0EXFaceDetectorManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFaceDetectorManagerProviderInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>

@implementation ABI47_0_0EXFaceDetectorManagerProvider

ABI47_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI47_0_0EXFaceDetectorManagerProviderInterface)];
}

- (id<ABI47_0_0EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[ABI47_0_0EXFaceDetectorManager alloc] init];
}

@end
