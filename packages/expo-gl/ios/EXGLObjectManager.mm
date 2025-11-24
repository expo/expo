// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXUIManager.h>

#import <ExpoGL/EXGLObjectManager.h>
#import <ExpoGL/EXGLObject.h>
#import <ExpoGL/EXGLCameraObject.h>

@interface EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLContext *> *glContexts;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, EXGLObject *> *objects; // Key is `EXGLObjectId`

@end

@implementation EXGLObjectManager

+ (nonnull instancetype)shared
{
  static EXGLObjectManager *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXGLObjectManager alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _glContexts = [NSMutableDictionary dictionary];
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
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

- (void)takeSnapshotWithContextId:(nonnull NSNumber *)exglCtxId
                       andOptions:(nonnull NSDictionary *)options
                         resolver:(EXPromiseResolveBlock)resolve
                         rejecter:(EXPromiseRejectBlock)reject
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];

  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, EXErrorWithMessage(@"ExponentGLObjectManager.takeSnapshotAsync: EXGLContext not found for given context id."));
    return;
  }

  [glContext takeSnapshotWithOptions:options resolve:resolve reject:reject];
}

- (void)destroyContextWithId:(nonnull NSNumber *)exglCtxId
                     resolve:(EXPromiseResolveBlock)resolve
                      reject:(EXPromiseRejectBlock)reject
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

- (void)destroyObjectAsync:(nonnull NSNumber *)exglObjId
                   resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject
{
  _objects[exglObjId] = nil;
  resolve(@(YES));
}

- (void)createTextureForContextWithId:(nonnull NSNumber *)exglCtxId
                           cameraView:(nonnull id<EXCameraInterface>)cameraView
                             resolver:(EXPromiseResolveBlock)resolve
                             rejecter:(EXPromiseRejectBlock)reject
{
  EXGLContext *glContext = [self getContextWithId:exglCtxId];

  if (glContext == nil) {
    reject(@"E_GL_BAD_VIEW_TAG", nil, EXErrorWithMessage(@"ExponentGLObjectManager.createCameraTextureAsync: Expected a GLView"));
    return;
  }

  EXGLCameraObject *cameraTexture = [[EXGLCameraObject alloc] initWithContext:glContext andCamera:cameraView];

  self->_objects[@(cameraTexture.exglObjId)] = cameraTexture;
  resolve(@{ @"exglObjId": @(cameraTexture.exglObjId) });
}

@end
