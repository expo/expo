// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFaceDetector/EXFaceDetectorManagerProvider.h>
#import <EXFaceDetector/EXFaceDetectorManager.h>
#import <EXFirebaseCore/UMFirebaseCoreInterface.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>

@interface EXFaceDetectorManagerProvider ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXFaceDetectorManagerProvider

UM_REGISTER_MODULE();

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(UMFaceDetectorManagerProvider)];
}

- (id<UMFaceDetectorManager>)createFaceDetectorManager
{
  id<UMFirebaseCoreInterface> firebaseCore = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMFirebaseCoreInterface)];
  if (!firebaseCore) {
    //reject(@"E_MODULE_UNAVAILABLE", @"No firebase core module", nil);
    return nil;
  }
  if (![firebaseCore defaultApp]) {
    //reject(@"E_FACE_DETECTION_FAILED", @"Firebase is not configured", nil);
    return nil;
  }
  return [[EXFaceDetectorManager alloc] initWithOptions:[EXFaceDetectorUtils defaultFaceDetectorOptions] appName:[firebaseCore defaultApp].name];
}

@end
