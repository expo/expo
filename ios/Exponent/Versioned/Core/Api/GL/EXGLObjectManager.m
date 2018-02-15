// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUIManager.h>

#import "EXGLObjectManager.h"
#import "EXGLObject.h"
#import "EXGLView.h"
#import "EXCamera.h"
#import "EXGLCameraObject.h"

@interface EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLObject *> *objects; // Key is `EXGLObjectId`

@end

@implementation EXGLObjectManager

RCT_EXPORT_MODULE(ExponentGLObjectManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

# pragma mark - Camera integration

RCT_REMAP_METHOD(createCameraTextureAsync,
                 createTextureForGLWithReactTag:(nonnull NSNumber *)glViewTag
                 andCameraWithReactTag:(nonnull NSNumber *)cameraViewTag
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactTag:glViewTag];
    UIView *cameraView = [self.bridge.uiManager viewForReactTag:cameraViewTag];
    
    if (![view isKindOfClass:[EXGLView class]]) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXGLView"));
      return;
    }
    if (![cameraView isKindOfClass:[EXCamera class]]) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXCamera"));
      return;
    }
    
    EXGLView *exglView = (EXGLView *)view;
    EXCamera *exCameraView = (EXCamera *)cameraView;

    EXGLCameraObject *cameraTexture = [[EXGLCameraObject alloc] initWithView:exglView andCamera:exCameraView];

    _objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  });
}

# pragma mark - Snapshots

RCT_REMAP_METHOD(takeSnapshotAsync,
                 takeSnapshotAsyncWithReactTag:(nonnull NSNumber *)tag
                 andOptions:(nonnull NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactTag:tag];
    
    if (![view isKindOfClass:[EXGLView class]]) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, RCTErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: Expected an EXGLView"));
      return;
    }
    
    EXGLView *exglView = (EXGLView *)view;
    [exglView takeSnapshotWithOptions:options callback:resolve];
  });
}

@end
