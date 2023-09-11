// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXUIManager.h>
#import <ExpoModulesCore/EXCameraInterface.h>

#import <ExpoGL/EXGLObjectManager.h>
#import <ExpoGL/EXGLObject.h>
#import <ExpoGL/EXGLView.h>
#import <ExpoGL/EXGLCameraObject.h>

@interface EXGLObjectManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLObject *> *objects; // Key is `EXGLObjectId`

@end

@implementation EXGLObjectManager

EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentGLObjectManager";
}

- (instancetype)init
{
  if ((self = [super init])) {
    _glContexts = [NSMutableDictionary dictionary];
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("host.exp.exponent.GLObjectManager", DISPATCH_QUEUE_SERIAL);
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
}

- (EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull EXGLContext *)glContext
{
  if (glContext.contextId != 0) {
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

EX_EXPORT_METHOD_AS(takeSnapshotAsync,
                    takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                    andOptions:(nonnull NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];

  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, EXErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: EXGLContext not found for given context id."));
    return;
  }

  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

EX_EXPORT_METHOD_AS(createContextAsync,
                    createContext:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [[EXGLContext alloc] initWithDelegate:nil
                                               andModuleRegistry:_moduleRegistry];

  [glContext initialize];
  [glContext prepare:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             EXErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  } andEnableExperimentalWorkletSupport:NO];
}

EX_EXPORT_METHOD_AS(destroyContextAsync,
                    destroyContextWithId:(nonnull NSNumber *)exglCtxId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(destroyObjectAsync,
                    destroyObjectAsync:(nonnull NSNumber *)exglObjId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

EX_EXPORT_METHOD_AS(createCameraTextureAsync,
                    createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                    andCameraWithReactTag:(nonnull NSNumber *)cameraViewTag
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    EXGLContext *glContext = [self getContextWithId:exglCtxId];
    id<EXCameraInterface> cameraView = (id<EXCameraInterface>)view;

    if (glContext == nil) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXGLView"));
      return;
    }
    if (cameraView == nil) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXCamera"));
      return;
    }

    EXGLCameraObject *cameraTexture = [[EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];

    self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  } forView:cameraViewTag implementingProtocol:@protocol(EXCameraInterface)];
}

@end
