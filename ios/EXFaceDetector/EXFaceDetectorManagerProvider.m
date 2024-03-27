// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFaceDetector/EXFaceDetectorManagerProvider.h>
#import <EXFaceDetector/EXFaceDetectorManager.h>
#import <ExpoModulesCore/EXFaceDetectorManagerProviderInterface.h>
#import <ExpoModulesCore/EXDefines.h>

@implementation EXFaceDetectorManagerProvider

EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(EXFaceDetectorManagerProviderInterface)];
}

- (id<EXFaceDetectorManagerInterface>)createFaceDetectorManager {
  return [[EXFaceDetectorManager alloc] init];
}

@end
