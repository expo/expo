// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXBluetooth/ABI38_0_0EXBluetooth.h>
#import <ABI38_0_0EXBluetooth/ABI38_0_0EXBluetooth+JSON.h>

@interface ABI38_0_0EXBluetooth()

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI38_0_0EXBluetooth

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  
}

#pragma mark - Expo

ABI38_0_0UM_EXPORT_MODULE(ExpoBluetooth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  return @{
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

- (void)startObserving {
  _isObserving = YES;
}

- (void)stopObserving {
  _isObserving = NO;
}

@end
