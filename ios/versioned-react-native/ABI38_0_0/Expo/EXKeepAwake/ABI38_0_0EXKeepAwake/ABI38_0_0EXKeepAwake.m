// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>
#import <ABI38_0_0EXKeepAwake/ABI38_0_0EXKeepAwake.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleService.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUtilities.h>

@interface ABI38_0_0EXKeepAwake () <ABI38_0_0UMAppLifecycleListener>

@property (nonatomic, weak) id<ABI38_0_0UMAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI38_0_0EXKeepAwake {
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  self = [super init];
  _activeTags = [NSMutableSet set];
  return self;
}

ABI38_0_0UM_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - ABI38_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

ABI38_0_0UM_EXPORT_METHOD_AS(activate, activate:(NSString *)tag
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  if(![self shouldBeActive]) {
    [ABI38_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
  [_activeTags addObject:tag];
  resolve(@YES);
}

ABI38_0_0UM_EXPORT_METHOD_AS(deactivate, deactivate:(NSString *)tag
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  [_activeTags removeObject:tag];
  if (![self shouldBeActive]) {
    [ABI38_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    }];
  }
  resolve(@YES);
}

# pragma mark - ABI38_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {
  [ABI38_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if ([self shouldBeActive]) {
    [ABI38_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (BOOL)shouldBeActive {
  return [_activeTags count] > 0;
}

@end
