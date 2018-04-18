// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>

#import "ABI27_0_0EXGLObjectManager.h"
#import "ABI27_0_0EXGLObject.h"
#import "ABI27_0_0EXGLView.h"
#import "ABI27_0_0EXCamera.h"
#import "ABI27_0_0EXGLCameraObject.h"

@interface ABI27_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI27_0_0EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI27_0_0EXGLObject *> *objects; // Key is `ABI27_0_0EXGLObjectId`

@end

@implementation ABI27_0_0EXGLObjectManager

ABI27_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

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

- (ABI27_0_0EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull ABI27_0_0EXGLContext *)glContext
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
  // destroy all GLContexts when ABI27_0_0EXGLObjectManager gets dealloced
  [_glContexts enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull contextId, ABI27_0_0EXGLContext * _Nonnull glContext, BOOL * _Nonnull stop) {
    [glContext destroy];
  }];
}

# pragma mark - Snapshots

ABI27_0_0RCT_REMAP_METHOD(takeSnapshotAsync,
                 takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                 andOptions:(nonnull NSDictionary *)options
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  ABI27_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, ABI27_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: ABI27_0_0EXGLContext not found for given context id."));
    return;
  }
  
  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

ABI27_0_0RCT_REMAP_METHOD(createContextAsync,
                 createContext:(ABI27_0_0RCTPromiseResolveBlock)resolve reject:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  ABI27_0_0EXGLContext *glContext = [[ABI27_0_0EXGLContext alloc] initWithDelegate:nil andManager:self];
  
  [glContext initialize:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             ABI27_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

ABI27_0_0RCT_REMAP_METHOD(destroyContextAsync,
                 destroyContextWithId:(nonnull NSNumber *)exglCtxId
                 resolve:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 reject:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  ABI27_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext != nil) {
    [glContext destroy];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

# pragma mark - Camera integration

ABI27_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

ABI27_0_0RCT_REMAP_METHOD(createCameraTextureAsync,
                 createTextureForGLWithReactABI27_0_0Tag:(nonnull NSNumber *)glViewTag
                 andCameraWithReactABI27_0_0Tag:(nonnull NSNumber *)cameraViewTag
                 resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactABI27_0_0Tag:glViewTag];
    UIView *cameraView = [self.bridge.uiManager viewForReactABI27_0_0Tag:cameraViewTag];
    
    if (![view isKindOfClass:[ABI27_0_0EXGLView class]]) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI27_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI27_0_0EXGLView"));
      return;
    }
    if (![cameraView isKindOfClass:[ABI27_0_0EXCamera class]]) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, ABI27_0_0RCTErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI27_0_0EXCamera"));
      return;
    }
    
    ABI27_0_0EXGLView *exglView = (ABI27_0_0EXGLView *)view;
    ABI27_0_0EXCamera *exCameraView = (ABI27_0_0EXCamera *)cameraView;

    ABI27_0_0EXGLCameraObject *cameraTexture = [[ABI27_0_0EXGLCameraObject alloc] initWithView:exglView andCamera:exCameraView];

    _objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  });
}

@end
