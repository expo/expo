// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFaceDetector/ABI40_0_0EXFaceDetectorManagerProvider.h>
#import <ABI40_0_0EXFaceDetector/ABI40_0_0EXFaceDetectorManager.h>

@implementation ABI40_0_0EXFaceDetectorManagerProvider

ABI40_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI40_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI40_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI40_0_0EXFaceDetectorManager alloc] init];
}

@end
