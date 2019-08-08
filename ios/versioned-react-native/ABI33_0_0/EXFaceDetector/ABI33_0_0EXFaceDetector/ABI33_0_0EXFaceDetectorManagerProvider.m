// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXFaceDetector/ABI33_0_0EXFaceDetectorManagerProvider.h>
#import <ABI33_0_0EXFaceDetector/ABI33_0_0EXFaceDetectorManager.h>

@implementation ABI33_0_0EXFaceDetectorManagerProvider

ABI33_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI33_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI33_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI33_0_0EXFaceDetectorManager alloc] init];
}

@end
