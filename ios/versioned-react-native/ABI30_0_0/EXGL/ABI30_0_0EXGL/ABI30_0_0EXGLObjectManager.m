// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUIManager.h>
#import <ABI30_0_0EXCameraInterface/ABI30_0_0EXCameraInterface.h>

#import <ABI30_0_0EXGL/ABI30_0_0EXGLObjectManager.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLObject.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLView.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLCameraObject.h>

@interface ABI30_0_0EXGLObjectManager ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI30_0_0EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI30_0_0EXGLObject *> *objects; // Key is `ABI30_0_0EXGLObjectId`

@end

@implementation ABI30_0_0EXGLObjectManager

ABI30_0_0EX_REGISTER_MODULE();

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

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _uiManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXUIManager)];
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXFileSystemInterface)];
}

- (ABI30_0_0EXGLContext *)getContextWithId:(NSNumber *)contextId
{
  return _glContexts[contextId];
}

- (void)saveContext:(nonnull ABI30_0_0EXGLContext *)glContext
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
  // destroy all GLContexts when ABI30_0_0EXGLObjectManager gets dealloced
  [_glContexts enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull contextId, ABI30_0_0EXGLContext * _Nonnull glContext, BOOL * _Nonnull stop) {
    [glContext destroy];
  }];
}

# pragma mark - Snapshots

ABI30_0_0EX_EXPORT_METHOD_AS(takeSnapshotAsync,
                    takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                    andOptions:(nonnull NSDictionary *)options
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  ABI30_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, ABI30_0_0EXErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: ABI30_0_0EXGLContext not found for given context id."));
    return;
  }
  
  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

# pragma mark - Headless Context

ABI30_0_0EX_EXPORT_METHOD_AS(createContextAsync,
                    createContext:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  ABI30_0_0EXGLContext *glContext = [[ABI30_0_0EXGLContext alloc] initWithDelegate:nil andModuleRegistry:_moduleRegistry];
  
  [glContext initialize:^(BOOL success) {
    if (success) {
      resolve(@{ @"exglCtxId": @(glContext.contextId) });
    } else {
      reject(
             @"E_GL_CONTEXT_NOT_INITIALIZED",
             nil,
             ABI30_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createContextAsync: Unexpected error occurred when initializing headless context")
             );
    }
  }];
}

ABI30_0_0EX_EXPORT_METHOD_AS(destroyContextAsync,
                    destroyContextWithId:(nonnull NSNumber *)exglCtxId
                    resolve:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  ABI30_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
  
  if (glContext != nil) {
    [glContext destroy];
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

# pragma mark - Camera integration

ABI30_0_0EX_EXPORT_METHOD_AS(destroyObjectAsync,
                    destroyObjectAsync:(nonnull NSNumber *)exglObjId
                    resolve:(ABI30_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

ABI30_0_0EX_EXPORT_METHOD_AS(createCameraTextureAsync,
                    createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                    andCameraWithReactABI30_0_0Tag:(nonnull NSNumber *)cameraViewTag
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  [_uiManager addUIBlock:^(id view) {
    ABI30_0_0EXGLContext *glContext = [self getContextWithId:exglCtxId];
    id<ABI30_0_0EXCameraInterface> cameraView = (id<ABI30_0_0EXCameraInterface>)view;
    
    if (glContext == nil) {
      reject(@"E_GL_BAD_VIEW_TAG", nil, ABI30_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI30_0_0EXGLView"));
      return;
    }
    if (cameraView == nil) {
      reject(@"E_GL_BAD_CAMERA_VIEW_TAG", nil, ABI30_0_0EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected an ABI30_0_0EXCamera"));
      return;
    }
    
    ABI30_0_0EXGLCameraObject *cameraTexture = [[ABI30_0_0EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];
    
    self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
    resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
  } forView:cameraViewTag implementingProtocol:@protocol(ABI30_0_0EXCameraInterface)];
}

@end
