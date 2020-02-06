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
  return [[EXFaceDetectorManager alloc] initWithOptions:[EXFaceDetectorUtils defaultFaceDetectorOptions] appName:nil];
  
  // The following code has been disabled for the time being. The face-detector module currently always uses the
  // default firebase-app, even on the Expo client. This means that the Expo firebase project gets hit when
  // performing face-detection. We might want to change this in the future so that it uses the Firebase project as configured
  // using 'googleServicesFile' in app.json. This would cause the customer Firebase project to be hit, allowing them
  // to verify that they have set-up face-detection correctly.
  /*id<UMFirebaseCoreInterface> firebaseCore = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMFirebaseCoreInterface)];
  if (!firebaseCore) {
    //reject(@"E_MODULE_UNAVAILABLE", @"No firebase core module", nil);
    return nil;
  }
  if (![firebaseCore defaultApp]) {
    //reject(@"E_FACE_DETECTION_FAILED", @"Firebase is not configured", nil);
    return nil;
  }
  return [[EXFaceDetectorManager alloc] initWithOptions:[EXFaceDetectorUtils defaultFaceDetectorOptions] appName:[firebaseCore defaultApp].name];*/
}

@end
