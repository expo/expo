#import <Flutter/Flutter.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXAppLifecycleService.h>
#import <EXCore/EXEventEmitterService.h>

@interface InternalServicesModule : NSObject<EXInternalModule, EXEventEmitterService, FlutterStreamHandler, EXAppLifecycleService>

@end
