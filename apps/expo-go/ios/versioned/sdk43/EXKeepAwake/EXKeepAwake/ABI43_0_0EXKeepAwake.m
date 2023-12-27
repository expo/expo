// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>
#import <ABI43_0_0EXKeepAwake/ABI43_0_0EXKeepAwake.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

@interface ABI43_0_0EXKeepAwake () <ABI43_0_0EXAppLifecycleListener>

@property (nonatomic, weak) id<ABI43_0_0EXAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXKeepAwake {
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  self = [super init];
  _activeTags = [NSMutableSet set];
  return self;
}

ABI43_0_0EX_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - ABI43_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(activate, activate:(NSString *)tag
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if(![self shouldBeActive]) {
    [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
  [_activeTags addObject:tag];
  resolve(@YES);
}

ABI43_0_0EX_EXPORT_METHOD_AS(deactivate, deactivate:(NSString *)tag
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [_activeTags removeObject:tag];
  if (![self shouldBeActive]) {
    [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    }];
  }
  resolve(@YES);
}

# pragma mark - ABI43_0_0EXAppLifecycleListener

- (void)onAppBackgrounded {
  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if ([self shouldBeActive]) {
    [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (BOOL)shouldBeActive {
  return [_activeTags count] > 0;
}

@end
