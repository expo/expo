// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>
#import <ABI37_0_0EXKeepAwake/ABI37_0_0EXKeepAwake.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>

@interface ABI37_0_0EXKeepAwake () <ABI37_0_0UMAppLifecycleListener>

@property (nonatomic, weak) id<ABI37_0_0UMAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0EXKeepAwake {
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  self = [super init];
  _activeTags = [NSMutableSet set];
  return self;
}

ABI37_0_0UM_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - ABI37_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

ABI37_0_0UM_EXPORT_METHOD_AS(activate, activate:(NSString *)tag
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if(![self shouldBeActive]) {
    [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
  [_activeTags addObject:tag];
  resolve(@YES);
}

ABI37_0_0UM_EXPORT_METHOD_AS(deactivate, deactivate:(NSString *)tag
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [_activeTags removeObject:tag];
  if (![self shouldBeActive]) {
    [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    }];
  }
  resolve(@YES);
}

# pragma mark - ABI37_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {
  [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if ([self shouldBeActive]) {
    [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (BOOL)shouldBeActive {
  return [_activeTags count] > 0;
}

@end
