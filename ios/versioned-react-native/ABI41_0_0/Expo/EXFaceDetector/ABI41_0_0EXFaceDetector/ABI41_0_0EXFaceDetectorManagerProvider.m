// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXFaceDetector/ABI41_0_0EXFaceDetectorManagerProvider.h>
#import <ABI41_0_0EXFaceDetector/ABI41_0_0EXFaceDetectorManager.h>

@implementation ABI41_0_0EXFaceDetectorManagerProvider

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI41_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI41_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI41_0_0EXFaceDetectorManager alloc] init];
}

@end
