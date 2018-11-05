// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>

#import "ABI26_0_0EXGLObjectManager.h"
#import "ABI26_0_0EXGLObject.h"
#import "ABI26_0_0EXGLView.h"
#import "ABI26_0_0EXCamera.h"
#import "ABI26_0_0EXGLCameraObject.h"

@interface ABI26_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI26_0_0EXGLObject *> *objects; // Key is `ABI26_0_0EXGLObjectId`

@end

@implementation ABI26_0_0EXGLObjectManager

ABI26_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("host.exp.exponent.GLObjectManager", DISPATCH_QUEUE_SERIAL);
}

ABI26_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

# pragma mark - Camera integration

ABI26_0_0RCT_REMAP_METHOD(createCameraTextureAsync,
                 createTextureForGLWithReactABI26_0_0Tag:(nonnull NSNumber *)glViewTag
                 andCameraWithReactABI26_0_0Tag:(nonnull NSNumber *)cameraViewTag
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactABI26_0_0Tag:glViewTag];
    UIView *cameraView = [self.bridge.uiManager viewForReactABI26_0_0Tag:cameraViewTag];
    
    if (![view isKindOfClass:[ABI26_0_0EXGLView class]]) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI26_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI26_0_0EXGLView"));
      return;
    }
    if (![cameraView isKindOfClass:[ABI26_0_0EXCamera class]]) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, ABI26_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI26_0_0EXCamera"));
      return;
    }
    
    ABI26_0_0EXGLView *exglView = (ABI26_0_0EXGLView *)view;
    ABI26_0_0EXCamera *exCameraView = (ABI26_0_0EXCamera *)cameraView;

    ABI26_0_0EXGLCameraObject *cameraTexture = [[ABI26_0_0EXGLCameraObject alloc] initWithView:exglView andCamera:exCameraView];

    _objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  });
}

# pragma mark - Snapshots

ABI26_0_0RCT_REMAP_METHOD(takeSnapshotAsync,
                 takeSnapshotAsyncWithReactABI26_0_0Tag:(nonnull NSNumber *)tag
                 andOptions:(nonnull NSDictionary *)options
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactABI26_0_0Tag:tag];
    
    if (![view isKindOfClass:[ABI26_0_0EXGLView class]]) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI26_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: Expected an ABI26_0_0EXGLView"));
      return;
    }
    
    ABI26_0_0EXGLView *exglView = (ABI26_0_0EXGLView *)view;
    [exglView takeSnapshotWithOptions:options callback:resolve];
  });
}

@end
