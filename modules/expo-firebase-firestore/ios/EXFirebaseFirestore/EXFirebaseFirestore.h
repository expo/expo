

#import <Foundation/Foundation.h>

#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>
#import <FirebaseFirestore/FirebaseFirestore.h>

@interface EXFirebaseFirestore : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@property NSMutableDictionary *transactions;
@property dispatch_queue_t transactionQueue;

+ (void)promiseRejectException:(EXPromiseRejectBlock)reject error:(NSError *)error;

+ (FIRFirestore *)getFirestoreForApp:(NSString *)appDisplayName;
+ (NSDictionary *)getJSError:(NSError *)nativeError;

@end
