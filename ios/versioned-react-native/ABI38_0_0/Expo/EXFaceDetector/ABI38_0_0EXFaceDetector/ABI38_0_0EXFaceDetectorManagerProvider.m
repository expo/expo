// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXFaceDetector/ABI38_0_0EXFaceDetectorManagerProvider.h>
#import <ABI38_0_0EXFaceDetector/ABI38_0_0EXFaceDetectorManager.h>

@implementation ABI38_0_0EXFaceDetectorManagerProvider

ABI38_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI38_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI38_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI38_0_0EXFaceDetectorManager alloc] init];
}

@end
