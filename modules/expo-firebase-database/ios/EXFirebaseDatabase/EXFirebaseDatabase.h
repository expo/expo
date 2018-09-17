

#import <Foundation/Foundation.h>
#import <FirebaseDatabase/FIRDatabase.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseDatabase : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@property NSMutableDictionary *dbReferences;
@property NSMutableDictionary *transactions;
@property dispatch_queue_t transactionQueue;

+ (void)handlePromise:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject databaseError:(NSError *)databaseError;

+ (FIRDatabase *)getDatabaseForApp:(NSString *)appDisplayName;
+ (FIRDatabase *)getDatabaseForApp:(NSString *)appDisplayName URL:(NSString *)url;

+ (NSDictionary *)getJSError:(NSError *)nativeError;

+ (NSString *)getMessageWithService:(NSString *)message service:(NSString *)service fullCode:(NSString *)fullCode;

+ (NSString *)getCodeWithService:(NSString *)service code:(NSString *)code;

@end

