// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>
#import <EXKeepAwake/EXKeepAwake.h>
#import <ExpoModulesCore/EXAppLifecycleService.h>
#import <ExpoModulesCore/EXUtilities.h>

@interface EXKeepAwake () <EXAppLifecycleListener>

@property (nonatomic, weak) id<EXAppLifecycleService> lifecycleManager;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXKeepAwake {
  NSMutableSet *_activeTags;
}

- (instancetype)init {
  self = [super init];
  _activeTags = [NSMutableSet set];
  return self;
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

EX_EXPORT_METHOD_AS(activate, activate:(NSString *)tag
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if(![self shouldBeActive]) {
    [EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
  [_activeTags addObject:tag];
  resolve(@YES);
}

EX_EXPORT_METHOD_AS(deactivate, deactivate:(NSString *)tag
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [_activeTags removeObject:tag];
  if (![self shouldBeActive]) {
    [EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    }];
  }
  resolve(@YES);
}

# pragma mark - EXAppLifecycleListener

- (void)onAppBackgrounded {
  [EXUtilities performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)onAppForegrounded {
  if ([self shouldBeActive]) {
    [EXUtilities performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (BOOL)shouldBeActive {
  return [_activeTags count] > 0;
}

@end
