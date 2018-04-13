// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUIManager.h>

#import "EXGLObjectManager.h"
#import "EXGLObject.h"
#import "EXGLView.h"
#import "EXCamera.h"
#import "EXGLCameraObject.h"

@interface EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLObject *> *objects; // Key is `EXGLObjectId`

@end

@implementation EXGLObjectManager

RCT_EXPORT_MODULE(ExponentGLObjectManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _glContexts = [NSMutableDictionary dictionary];
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

- (EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull EXGLContext *)glContext
{
  if (glContext.isInitialized) {
    [_glContexts setObject:glContext forKey:@(glContext.contextId)];
  }
}

- (void)deleteContextWithId:(nonnull NSNumber *)contextId
{
  [_glContexts removeObjectForKey:contextId];
}

- (void)dealloc
{
  // destroy all GLContexts when EXGLObjectManager gets dealloced
  [_glContexts enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull contextId, EXGLContext * _Nonnull glContext, BOOL * _Nonnull stop) {
    [glContext destroy];
  }];
}

# pragma mark - Snapshots

RCT_REMAP_METHOD(takeSnapshotAsync,
                 takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                 andOptions:(nonnull NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, RCTErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: EXGLContext not found for given context id."));
    return;
  }
  
  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

RCT_REMAP_METHOD(createContextAsync,
                 createContext:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [[EXGLContext alloc] initWithDelegate:nil andManager:self];
  
  [glContext initialize:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             RCTErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

RCT_REMAP_METHOD(destroyContextAsync,
                 destroyContextWithId:(nonnull NSNumber *)exglCtxId
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext != nil) {
    [glContext destroy];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

# pragma mark - Camera integration

RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

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

@end
