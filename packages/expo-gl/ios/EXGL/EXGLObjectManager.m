// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMUIManager.h>
#import <UMCameraInterface/UMCameraInterface.h>

#import <EXGL/EXGLObjectManager.h>
#import <EXGL/EXGLObject.h>
#import <EXGL/EXGLView.h>
#import <EXGL/EXGLCameraObject.h>

@interface EXGLObjectManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLObject *> *objects; // Key is `EXGLObjectId`

@end

@implementation EXGLObjectManager

UM_REGISTER_MODULE();

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

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
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

UM_EXPORT_METHOD_AS(takeSnapshotAsync,
                    takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                    andOptions:(nonnull NSDictionary *)options
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, UMErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: EXGLContext not found for given context id."));
    return;
  }
  
  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

UM_EXPORT_METHOD_AS(createContextAsync,
                    createContext:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  EXGLContext *glContext = [[EXGLContext alloc] initWithDelegate:nil andModuleRegistry:_moduleRegistry];
  
  [glContext initialize:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             UMErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

UM_EXPORT_METHOD_AS(destroyContextAsync,
                    destroyContextWithId:(nonnull NSNumber *)exglCtxId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(destroyObjectAsync,
                    destroyObjectAsync:(nonnull NSNumber *)exglObjId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

UM_EXPORT_METHOD_AS(createCameraTextureAsync,
                    createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                    andCameraWithReactTag:(nonnull NSNumber *)cameraViewTag
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [_uiManager executeUIBlock:^(id view) {
    EXGLContext *glContext = [self getContextWithId:exglCtxId];
    id<UMCameraInterface> cameraView = (id<UMCameraInterface>)view;
    
    if (glContext == nil) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, UMErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXGLView"));
      return;
    }
    if (cameraView == nil) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, UMErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an EXCamera"));
      return;
    }
    
    EXGLCameraObject *cameraTexture = [[EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];
    
    self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  } forView:cameraViewTag implementingProtocol:@protocol(UMCameraInterface)];
}

@end
