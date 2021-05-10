// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXFaceDetector/ABI39_0_0EXFaceDetectorManagerProvider.h>
#import <ABI39_0_0EXFaceDetector/ABI39_0_0EXFaceDetectorManager.h>

@implementation ABI39_0_0EXFaceDetectorManagerProvider

ABI39_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI39_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI39_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI39_0_0EXFaceDetectorManager alloc] init];
}

@end
