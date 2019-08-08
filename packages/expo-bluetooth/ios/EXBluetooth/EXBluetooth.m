// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth.h>
#import <EXBluetooth/EXBluetooth+JSON.h>

@interface EXBluetooth()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL isObserving;

@end

@implementation EXBluetooth

- (void)dealloc {
  [self invalidate];
}

- (void)invalidate {
  
}

#pragma mark - Expo

UM_EXPORT_MODULE(ExpoBluetooth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
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
