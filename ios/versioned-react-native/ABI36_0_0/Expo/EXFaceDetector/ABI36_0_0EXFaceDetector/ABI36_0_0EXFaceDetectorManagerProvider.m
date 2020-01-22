// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXFaceDetector/ABI36_0_0EXFaceDetectorManagerProvider.h>
#import <ABI36_0_0EXFaceDetector/ABI36_0_0EXFaceDetectorManager.h>

@implementation ABI36_0_0EXFaceDetectorManagerProvider

ABI36_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI36_0_0UMFaceDetectorManagerProvider)];
}

- (id<ABI36_0_0UMFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI36_0_0EXFaceDetectorManager alloc] init];
}

@end
