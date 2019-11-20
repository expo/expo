// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXFaceDetector/ABI34_0_0EXFaceDetectorManagerProvider.h>
#import <ABI34_0_0EXFaceDetector/ABI34_0_0EXFaceDetectorManager.h>

@implementation ABI34_0_0EXFaceDetectorManagerProvider

ABI34_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI34_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI34_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI34_0_0EXFaceDetectorManager alloc] init];
}

@end
