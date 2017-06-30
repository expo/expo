// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelBridgeRegistry.h"
#import "EXKernel.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelReactAppManager.h"

#import <React/RCTBridge.h>

@interface EXKernelBridgeRegistry ()

@property (nonatomic, strong) NSMapTable<id, EXKernelBridgeRecord *> *bridgeRegistry;
@property (nonatomic, assign) EXKernelReactAppManager *kernelAppManager;

@end

@implementation EXKernelBridgeRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _bridgeRegistry = [NSMapTable mapTableWithKeyOptions:NSPointerFunctionsWeakMemory valueOptions:NSPointerFunctionsStrongMemory];
  }
  return self;
}

- (void)registerBridge:(nonnull id)bridge withExperienceId:(NSString *)experienceId appManager:(EXFrameReactAppManager *)appManager
{
  NSAssert(experienceId, @"Cannot register a bridge with no experience id");
  NSAssert(appManager.frame, @"Cannot register an app manager with no frame");
  for (id bridge in self.bridgeEnumerator) {
    EXKernelBridgeRecord *record = [self recordForBridge:bridge];
    if ([record.experienceId isEqualToString:experienceId]) {
      NSAssert(NO, @"Cannot register a bridge with a non-unique experience id");
    }
  }
  [_bridgeRegistry setObject:[EXKernelBridgeRecord recordWithExperienceId:experienceId appManager:appManager] forKey:bridge];

  // if this experience had a loading error previously, consider it recovered now
  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager experienceRestartedWithId:experienceId];

  if (_lastKnownForegroundBridge == nil) {
    // TODO: this assumes we always load bridges in the foreground (true at time of writing)
    _lastKnownForegroundBridge = bridge;
  }
}

- (void)unregisterBridge:(id)bridge
{
  EXKernelBridgeRecord *record = [_bridgeRegistry objectForKey:bridge];
  if (record) {
    [_bridgeRegistry removeObjectForKey:bridge];
  }
}

- (void)registerKernelAppManager:(EXKernelReactAppManager *)appManager
{
  _kernelAppManager = appManager;
}

- (void)unregisterKernelAppManager
{
  _kernelAppManager = nil;
}

- (EXKernelReactAppManager *)kernelAppManager
{
  return _kernelAppManager;
}

- (EXKernelBridgeRecord *)recordForBridge:(id)bridge
{
  return [_bridgeRegistry objectForKey:bridge];
}

- (NSEnumerator<id> *)bridgeEnumerator
{
  return [_bridgeRegistry keyEnumerator];
}

- (EXReactAppManager *)lastKnownForegroundAppManager
{
  EXKernelBridgeRecord *foregroundBridgeRecord = [self recordForBridge:_lastKnownForegroundBridge];
  if (foregroundBridgeRecord) {
    return foregroundBridgeRecord.appManager;
  }
  return _kernelAppManager;
}

- (NSString *)description
{
  if (_bridgeRegistry.count > 0) {
    NSMutableString *results = [NSMutableString string];
    for (id bridge in self.bridgeEnumerator) {
      EXKernelBridgeRecord *record = [self recordForBridge:bridge];
      [results appendString:[NSString stringWithFormat:@"  %@: %@\n", bridge, record.experienceId]];
    }
    return [NSString stringWithFormat:@"EXKernelBridgeRegistry with bridges: {\n%@}", results];
  }
  return @"EXKernelBridgeRegistry (empty)";
}

@end
