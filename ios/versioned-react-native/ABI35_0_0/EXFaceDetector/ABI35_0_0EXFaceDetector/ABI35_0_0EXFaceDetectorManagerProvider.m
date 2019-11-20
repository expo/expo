// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXFaceDetector/ABI35_0_0EXFaceDetectorManagerProvider.h>
#import <ABI35_0_0EXFaceDetector/ABI35_0_0EXFaceDetectorManager.h>

@implementation ABI35_0_0EXFaceDetectorManagerProvider

ABI35_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI35_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI35_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI35_0_0EXFaceDetectorManager alloc] init];
}

@end
