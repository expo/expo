#import "ExpoFlutterAdapterPlugin.h"
#import <Flutter/Flutter.h>
#import "InternalServicesModule.h"
#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryProvider.h>
#import <UMCore/UMEventEmitter.h>

@interface ExpoFlutterAdapterPlugin ()

@property (nonatomic, strong) UMModuleRegistry *moduleRegistry;
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
        
        UMExportedModule* module = [_moduleRegistry getExportedModuleForName:moduleName];
        
        [module getExportedMethods];
        
        if (module == nil) {
            NSString *reason = [NSString stringWithFormat:@"No exported module was found for name '%@'. Are you sure all the packages are linked correctly?", moduleName];
            result([FlutterError errorWithCode:@"E_NO_MODULE" message:reason details:nil]);
        }
        
        if ([module conformsToProtocol:@protocol(UMEventEmitter)] && ([methodName isEqualToString:@"startObserving"] || [methodName isEqualToString:@"stopObserving"])) {
            id<UMEventEmitter> eventEmitter = (id<UMEventEmitter>)module;
            
            if ([methodName isEqualToString:@"startObserving"]) {
                [eventEmitter startObserving];
                 result(@{@"status": @"success", @"payload":[NSNull null]});
            } else if ([methodName isEqualToString:@"stopObserving"]) {
                [eventEmitter stopObserving];
               result(@{@"status": @"success", @"payload":[NSNull null]});
            }
        } else {
            UMPromiseResolveBlock resolve = ^(id res) {
                result(@{@"status": @"success",@"payload":res});
            };
            UMPromiseRejectBlock reject = ^(NSString* code, NSString* message, NSError* error) {
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
        UMModuleRegistryProvider *moduleRegistryProvider = [[UMModuleRegistryProvider alloc] init];
        _moduleRegistry = [moduleRegistryProvider moduleRegistry];
        [_moduleRegistry initialize];

        NSArray<id<UMInternalModule>> *internalModules = [_moduleRegistry getAllInternalModules];

        for (int i = 0; i < [internalModules count]; i++) {
            id<UMInternalModule> module = [internalModules objectAtIndex:i];

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