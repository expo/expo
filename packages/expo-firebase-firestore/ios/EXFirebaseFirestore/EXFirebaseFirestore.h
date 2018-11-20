// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>
#import <FirebaseFirestore/FirebaseFirestore.h>

@interface EXFirebaseFirestore : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@property NSMutableDictionary *transactions;

+ (void)promiseRejectException:(EXPromiseRejectBlock)reject error:(NSError *)error;

+ (FIRFirestore *)getFirestoreForApp:(NSString *)appDisplayName;
+ (NSDictionary *)getJSError:(NSError *)nativeError;

@end
