#import "ExpoFlutterAdapterPlugin.h"
#import "InternalServicesModule.h"
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryProvider.h>
#import <EXCore/EXEventEmitter.h>

@interface ExpoFlutterAdapterPlugin ()

@property (nonatomic, strong) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) InternalServicesModule *internalServicesModule;

@end

@implementation ExpoFlutterAdapterPlugin

# pragma mark FlutterPlugin impl

+ (void)registerWithRegistrar:(NSObject<FlutterPluginRegistrar>*)registrar {
    FlutterMethodChannel* channel = [FlutterMethodChannel
                                     methodChannelWithName:@"flutter_adapter.expo.io/method_calls"
                                     binaryMessenger:[registrar messenger]];
    ExpoFlutterAdapterPlugin* instance = [[ExpoFlutterAdapterPlugin alloc] initWithRegistrar:registrar];
    [registrar addMethodCallDelegate:instance channel:channel];
}

- (void)handleMethodCall:(FlutterMethodCall*)call result:(FlutterResult)result {
    if ([@"callMethod" isEqualToString:call.method]) {
        NSString* moduleName = call.arguments[@"moduleName"];
        NSString* methodName = call.arguments[@"methodName"];
        NSArray* arguments = call.arguments[@"arguments"];
        
        EXExportedModule* module = [_moduleRegistry getExportedModuleForName:moduleName];
        
        [module getExportedMethods];
        
        if (module == nil) {
            NSString *reason = [NSString stringWithFormat:@"No exported module was found for name '%@'. Are you sure all the packages are linked correctly?", moduleName];
            result([FlutterError errorWithCode:@"E_NO_MODULE" message:reason details:nil]);
        }
        
        if ([module conformsToProtocol:@protocol(EXEventEmitter)] && ([methodName isEqualToString:@"startObserving"] || [methodName isEqualToString:@"stopObserving"])) {
            id<EXEventEmitter> eventEmitter = (id<EXEventEmitter>)module;
            
            if ([methodName isEqualToString:@"startObserving"]) {
                [eventEmitter startObserving];
                 result(@{@"status": @"success", @"payload":[NSNull null]});
            } else if ([methodName isEqualToString:@"stopObserving"]) {
                [eventEmitter stopObserving];
               result(@{@"status": @"success", @"payload":[NSNull null]});
            }
        } else {
            EXPromiseResolveBlock resolve = ^(id res) {
                result(@{@"status": @"success",@"payload":res});
            };
            EXPromiseRejectBlock reject = ^(NSString* code, NSString* message, NSError* error) {
                result(@{ @"status": @"error", @"code":code, @"message":message, @"details":[error localizedDescription]});
            };
            
            dispatch_async([module methodQueue], ^{
                [module callExportedMethod:methodName withArguments:arguments resolver:resolve rejecter:reject];
            });
        }
    } else {
        result(FlutterMethodNotImplemented);
    }
}

- (instancetype)initWithRegistrar:(NSObject<FlutterPluginRegistrar>*)registrar {
    if (self = [super init]) {
        EXModuleRegistryProvider *moduleRegistryProvider = [[EXModuleRegistryProvider alloc] init];
        _moduleRegistry = [moduleRegistryProvider moduleRegistryForExperienceId:@"expo_flutter_adapter"];
        [_moduleRegistry initialize];

        NSArray<id<EXInternalModule>> *internalModules = [_moduleRegistry getAllInternalModules];

        for (int i = 0; i < [internalModules count]; i++) {
            id<EXInternalModule> module = [internalModules objectAtIndex:i];

            if ([module isKindOfClass:[InternalServicesModule class]]) {
                FlutterEventChannel* eventChannel =
                [FlutterEventChannel eventChannelWithName:@"flutter_adapter.expo.io/events" binaryMessenger:[registrar messenger]];
                [eventChannel setStreamHandler:module];
                _internalServicesModule = (InternalServicesModule*) module;
                break;
            }
        }

    }
    return self;
}

- (void)applicationWillEnterForeground:(nonnull UIApplication *)application {
    if (!_internalServicesModule) {
        return;
    }

    [_internalServicesModule setAppStateToForeground];
}
- (void)applicationDidEnterBackground:(nonnull UIApplication *)application {
    if (!_internalServicesModule) {
        return;
    }
    [_internalServicesModule setAppStateToBackground];
}

@end

#pragma mark EXCore Logging Blocks

extern void EXLogInfo(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"%@", message);
}

extern void EXLogWarn(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"%@", message);
}

extern void EXLogError(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"%@", message);
}

extern void EXFatal(NSError *error) {
    NSLog(@"%@",[error description]);
}

extern NSError * EXErrorWithMessage(NSString *message) {
    NSLog(@"%@", message);
    return nil;
}

extern UIApplication *EXSharedApplication() {
    return nil;
}
