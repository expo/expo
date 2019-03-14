// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMModuleRegistry.h>
#import <EXKeepAwake/EXKeepAwake.h>
#import <UMCore/UMAppLifecycleService.h>
#import <UMCore/UMUtilities.h>

@interface EXKeepAwake () <UMAppLifecycleListener>

@property (nonatomic, weak) id<UMAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXKeepAwake {
  BOOL _active;
}

UM_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

UM_EXPORT_METHOD_AS(activate, activate:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  _active = YES;
  [UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }];
  resolve(@YES);
}

UM_EXPORT_METHOD_AS(deactivate, deactivate:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  _active = NO;
  [UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
  resolve(@YES);
}

# pragma mark - UMAppLifecycleListener

- (void)onAppBackgrounded {
  [UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if (_active) {
    [UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

@end
