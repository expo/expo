

#import <EXFirebaseCrashlytics/EXFirebaseCrashlytics.h>
#import <Crashlytics/Crashlytics.h>

@interface EXFirebaseCrashlytics ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXFirebaseCrashlytics

EX_EXPORT_MODULE(ExpoFirebaseCrashlytics);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
    _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(crash,
                    crash:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [[Crashlytics sharedInstance] crash];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(log,
                    log:(NSString *)message
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    CLS_LOG(@"%@", message);
    resolve(nil);
}

EX_EXPORT_METHOD_AS(recordError,
                    recordError:(nonnull NSNumber *)code
                    domain:(NSString *)domain
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    NSError *error = [NSError errorWithDomain:domain code:[code integerValue] userInfo:nil];
    [CrashlyticsKit recordError:error];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(setBoolValue,
                    setBoolValue:(NSString *)key
                    boolValue:(BOOL *)boolValue
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [CrashlyticsKit setBoolValue:boolValue forKey:key];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(setFloatValue,
                    setFloatValue:(NSString *)key
                    floatValue:(nonnull NSNumber *)floatValue
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [CrashlyticsKit setFloatValue:[floatValue floatValue] forKey:key];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(setIntValue,
                    setIntValue:(NSString *)key
                    intValue:(nonnull NSNumber *)intValue
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [CrashlyticsKit setIntValue:[intValue integerValue] forKey:key];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(setStringValue,
                    setStringValue:(NSString *)key
                    stringValue:(NSString *)stringValue
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [CrashlyticsKit setObjectValue:stringValue forKey:key];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(setUserIdentifier,
                    setUserIdentifier:(NSString *)userId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [CrashlyticsKit setUserIdentifier:userId];
    resolve(nil);
}

@end
