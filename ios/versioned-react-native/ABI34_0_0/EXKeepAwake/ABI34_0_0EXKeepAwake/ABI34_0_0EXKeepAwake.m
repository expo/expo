// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>
#import <ABI34_0_0EXKeepAwake/ABI34_0_0EXKeepAwake.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppLifecycleService.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilities.h>

@interface ABI34_0_0EXKeepAwake () <ABI34_0_0UMAppLifecycleListener>

@property (nonatomic, weak) id<ABI34_0_0UMAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXKeepAwake {
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  self = [super init];
  _activeTags = [NSMutableSet set];
  return self;
}

ABI34_0_0UM_EXPORT_MODULE(ExpoKeepAwake);

# pragma mark - ABI34_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [_lifecycleManager unregisterAppLifecycleListener:self];
  }
  
  _lifecycleManager = nil;
  
  if (moduleRegistry) {
    _lifecycleManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMAppLifecycleService)];
  }
  
  if (_lifecycleManager) {
    [_lifecycleManager registerAppLifecycleListener:self];
  }
}

ABI34_0_0UM_EXPORT_METHOD_AS(activate, activate:(NSString *)tag
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if(![self shouldBeActive]) {
    [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
  [_activeTags addObject:tag];
  resolve(@YES);
}

ABI34_0_0UM_EXPORT_METHOD_AS(deactivate, deactivate:(NSString *)tag
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [_activeTags removeObject:tag];
  if (![self shouldBeActive]) {
    [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    }];
  }
  resolve(@YES);
}

# pragma mark - ABI34_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {
  [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if ([self shouldBeActive]) {
    [ABI34_0_0UMUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (BOOL)shouldBeActive {
  return [_activeTags count] > 0;
}

@end
