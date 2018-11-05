// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXFaceDetector/ABI30_0_0EXFaceDetectorManagerProvider.h>
#import <ABI30_0_0EXFaceDetector/ABI30_0_0EXFaceDetectorManager.h>

@implementation ABI30_0_0EXFaceDetectorManagerProvider

ABI30_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI30_0_0EXFaceDetectorManagerProvider)];
}

- (id<ABI30_0_0EXFaceDetectorManager>)createFaceDetectorManager {
  return [[ABI30_0_0EXFaceDetectorManager alloc] init];
}

@end
