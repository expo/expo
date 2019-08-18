// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXUIManager.h>
#import <ABI32_0_0EXCameraInterface/ABI32_0_0EXCameraInterface.h>

#import <ABI32_0_0EXGL/ABI32_0_0EXGLObjectManager.h>
#import <ABI32_0_0EXGL/ABI32_0_0EXGLObject.h>
#import <ABI32_0_0EXGL/ABI32_0_0EXGLView.h>
#import <ABI32_0_0EXGL/ABI32_0_0EXGLCameraObject.h>

@interface ABI32_0_0EXGLObjectManager ()

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI32_0_0EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI32_0_0EXGLObject *> *objects; // Key is `ABI32_0_0EXGLObjectId`

@end

@implementation ABI32_0_0EXGLObjectManager

ABI32_0_0EX_REGISTER_MODULE();

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

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXFileSystemInterface)];
}

- (ABI32_0_0EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull ABI32_0_0EXGLContext *)glContext
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
  // destroy all GLContexts when ABI32_0_0EXGLObjectManager gets dealloced
  [_glContexts enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull contextId, ABI32_0_0EXGLContext * _Nonnull glContext, BOOL * _Nonnull stop) {
    [glContext destroy];
  }];
}

# pragma mark - Snapshots

ABI32_0_0EX_EXPORT_METHOD_AS(takeSnapshotAsync,
                    takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                    andOptions:(nonnull NSDictionary *)options
                    resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  ABI32_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, ABI32_0_0EXErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: ABI32_0_0EXGLContext not found for given context id."));
    return;
  }
  
  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

ABI32_0_0EX_EXPORT_METHOD_AS(createContextAsync,
                    createContext:(ABI32_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  ABI32_0_0EXGLContext *glContext = [[ABI32_0_0EXGLContext alloc] initWithDelegate:nil andModuleRegistry:_moduleRegistry];
  
  [glContext initialize:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             ABI32_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

ABI32_0_0EX_EXPORT_METHOD_AS(destroyContextAsync,
                    destroyContextWithId:(nonnull NSNumber *)exglCtxId
                    resolve:(ABI32_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  ABI32_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext != nil) {
    [glContext destroy];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

# pragma mark - Camera integration

ABI32_0_0EX_EXPORT_METHOD_AS(destroyObjectAsync,
                    destroyObjectAsync:(nonnull NSNumber *)exglObjId
                    resolve:(ABI32_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

ABI32_0_0EX_EXPORT_METHOD_AS(createCameraTextureAsync,
                    createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                    andCameraWithReactABI32_0_0Tag:(nonnull NSNumber *)cameraViewTag
                    resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  [_uiManager addUIBlock:^(id view) {
    ABI32_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
    id<ABI32_0_0EXCameraInterface> cameraView = (id<ABI32_0_0EXCameraInterface>)view;
    
    if (glContext == nil) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI32_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI32_0_0EXGLView"));
      return;
    }
    if (cameraView == nil) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, ABI32_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI32_0_0EXCamera"));
      return;
    }
    
    ABI32_0_0EXGLCameraObject *cameraTexture = [[ABI32_0_0EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];
    
    self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  } forView:cameraViewTag implementingProtocol:@protocol(ABI32_0_0EXCameraInterface)];
}

@end
