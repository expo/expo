// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFaceDetector/EXFaceDetectorManagerProvider.h>
#import <EXFaceDetector/EXFaceDetectorManager.h>

@implementation EXFaceDetectorManagerProvider

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(UMFaceDetectorManagerProvider)];
}

- (id<UMFaceDetectorManager>)createFaceDetectorManager {
  return [[EXFaceDetectorManager alloc] init];
}

@end
