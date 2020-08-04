// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXFaceDetector/ABI37_0_0EXFaceDetectorManagerProvider.h>
#import <ABI37_0_0EXFaceDetector/ABI37_0_0EXFaceDetectorManager.h>

@implementation ABI37_0_0EXFaceDetectorManagerProvider

ABI37_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI37_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI37_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI37_0_0EXFaceDetectorManager alloc] init];
}

@end
