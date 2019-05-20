#import "InternalServicesModule.h"
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryProvider.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXCore/EXEventEmitter.h>

@interface InternalServicesModule ()

@property (nonatomic, strong) FlutterEventSink sink;
@property (nonatomic, strong) NSMutableSet<id<EXAppLifecycleListener>> *lifecycleListeners;
@property (nonatomic, assign) BOOL isForegrounded;

@end

@implementation InternalServicesModule

EX_REGISTER_MODULE();

#pragma mark EXInternalModule impl

- (instancetype)init {
    if (self = [super init]) {
        _lifecycleListeners = [NSMutableSet set];
        _isForegrounded = false;
    }
    return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
    return @[@protocol(EXEventEmitterService), @protocol(EXAppLifecycleService)];
}

# pragma mark EXEventEmitterService impl

- (void)sendEventWithName:(NSString *)eventName body:(id)body {
    if (!_sink) {
        return;
    };
    
    self.sink(@{
        @"eventName" : [eventName copy],
        @"body" : body
    });
}

#pragma mark FlutterInternalServicesModule impl

- (FlutterError*)onListenWithArguments:(id)arguments eventSink:(FlutterEventSink)eventSink {
    self.sink = eventSink;
    return nil;
}

- (FlutterError*)onCancelWithArguments:(id)arguments {
    self.sink = nil;
    return nil;
}

#pragma mark EXAppLifecycleService impl


- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener {
  [_lifecycleListeners addObject:listener];
}

- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener {
  [_lifecycleListeners removeObject:listener];
}

- (void)setAppStateToBackground
{
  if (_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  }
}

- (void)setAppStateToForeground
{
  if (!_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppForegrounded];
    }];
    _isForegrounded = true;
  }
}



@end