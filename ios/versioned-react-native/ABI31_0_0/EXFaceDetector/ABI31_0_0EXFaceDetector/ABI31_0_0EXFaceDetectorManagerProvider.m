// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceDetectorManagerProvider.h>
#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceDetectorManager.h>

@implementation ABI31_0_0EXFaceDetectorManagerProvider

ABI31_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI31_0_0EXFaceDetectorManagerProvider)];
}

- (id<ABI31_0_0EXFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI31_0_0EXFaceDetectorManager alloc] init];
}

@end
