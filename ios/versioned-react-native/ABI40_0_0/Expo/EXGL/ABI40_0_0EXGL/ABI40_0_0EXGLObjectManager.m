// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistry.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUIManager.h>
#import <ABI40_0_0UMCameraInterface/ABI40_0_0UMCameraInterface.h>

#import <ABI40_0_0EXGL/ABI40_0_0EXGLObjectManager.h>
#import <ABI40_0_0EXGL/ABI40_0_0EXGLObject.h>
#import <ABI40_0_0EXGL/ABI40_0_0EXGLView.h>
#import <ABI40_0_0EXGL/ABI40_0_0EXGLCameraObject.h>

@interface ABI40_0_0EXGLObjectManager ()

@property (nonatomic, weak) ABI40_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI40_0_0EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI40_0_0EXGLObject *> *objects; // Key is `ABI40_0_0EXGLObjectId`

@end

@implementation ABI40_0_0EXGLObjectManager

ABI40_0_0UM_REGISTER_MODULE();

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

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMFileSystemInterface)];
}

- (ABI40_0_0EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull ABI40_0_0EXGLContext *)glContext
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
  // destroy all GLContexts when ABI40_0_0EXGLObjectManager gets dealloced
  [_glContexts enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull contextId, ABI40_0_0EXGLContext * _Nonnull glContext, BOOL * _Nonnull stop) {
    [glContext destroy];
  }];
}

# pragma mark - Snapshots

ABI40_0_0UM_EXPORT_METHOD_AS(takeSnapshotAsync,
                    takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                    andOptions:(nonnull NSDictionary *)options
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  ABI40_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];

  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, ABI40_0_0UMErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: ABI40_0_0EXGLContext not found for given context id."));
    return;
  }

  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

ABI40_0_0UM_EXPORT_METHOD_AS(createContextAsync,
                    createContext:(ABI40_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  ABI40_0_0EXGLContext *glContext = [[ABI40_0_0EXGLContext alloc] initWithDelegate:nil andModuleRegistry:_moduleRegistry];

  [glContext initialize];
  [glContext prepare:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             ABI40_0_0UMErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

ABI40_0_0UM_EXPORT_METHOD_AS(destroyContextAsync,
                    destroyContextWithId:(nonnull NSNumber *)exglCtxId
                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  ABI40_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];

  if (glContext != nil) {
    [glContext destroy];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

# pragma mark - Camera integration

ABI40_0_0UM_EXPORT_METHOD_AS(destroyObjectAsync,
                    destroyObjectAsync:(nonnull NSNumber *)exglObjId
                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

ABI40_0_0UM_EXPORT_METHOD_AS(createCameraTextureAsync,
                    createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                    andCameraWithABI40_0_0ReactTag:(nonnull NSNumber *)cameraViewTag
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    ABI40_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
    id<ABI40_0_0UMCameraInterface> cameraView = (id<ABI40_0_0UMCameraInterface>)view;

    if (glContext == nil) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI40_0_0UMErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI40_0_0EXGLView"));
      return;
    }
    if (cameraView == nil) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, ABI40_0_0UMErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI40_0_0EXCamera"));
      return;
    }

    ABI40_0_0EXGLCameraObject *cameraTexture = [[ABI40_0_0EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];

    self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  } forView:cameraViewTag implementingProtocol:@protocol(ABI40_0_0UMCameraInterface)];
}

@end
