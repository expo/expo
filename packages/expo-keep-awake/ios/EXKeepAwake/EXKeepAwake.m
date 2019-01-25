// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXModuleRegistry.h>
#import <EXKeepAwake/EXKeepAwake.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXUtilities.h>

@interface EXKeepAwake () <EXAppLifecycleListener>

@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXKeepAwake {
  BOOL _active;
}

EX_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

EX_EXPORT_METHOD_AS(activate, activate:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  _active = YES;
  [EXUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }];
  resolve(@YES);
}

EX_EXPORT_METHOD_AS(deactivate, deactivate:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  _active = NO;
  [EXUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
  resolve(@YES);
}

# pragma mark - EXAppLifecycleListener

- (void)onAppBackgrounded {
  [EXUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if (_active) {
    [EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

@end
