// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXBluetooth/ABI35_0_0EXBluetooth.h>
#import <ABI35_0_0EXBluetooth/ABI35_0_0EXBluetooth+JSON.h>

@interface ABI35_0_0EXBluetooth()

@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL isObserving;

@end

@implementation ABI35_0_0EXBluetooth

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  
}

#pragma mark - Expo

ABI35_0_0UM_EXPORT_MODULE(ExpoBluetooth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry
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
