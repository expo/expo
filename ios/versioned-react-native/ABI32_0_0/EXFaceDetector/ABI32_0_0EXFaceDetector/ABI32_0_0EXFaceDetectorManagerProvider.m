// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXFaceDetector/ABI32_0_0EXFaceDetectorManagerProvider.h>
#import <ABI32_0_0EXFaceDetector/ABI32_0_0EXFaceDetectorManager.h>

@implementation ABI32_0_0EXFaceDetectorManagerProvider

ABI32_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI32_0_0EXFaceDetectorManagerProvider)];
}

- (id<ABI32_0_0EXFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI32_0_0EXFaceDetectorManager alloc] init];
}

@end
