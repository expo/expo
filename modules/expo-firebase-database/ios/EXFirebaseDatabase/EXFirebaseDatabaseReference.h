#import <Foundation/Foundation.h>
#import <FirebaseDatabase/FIRDatabase.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXEventEmitterService.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXFirebaseDatabase/EXFirebaseDatabase.h>

@interface EXFirebaseDatabaseReference : NSObject
@property id<EXEventEmitterService> emitter;
@property FIRDatabaseQuery *query;
@property NSString *appDisplayName;
@property NSString *dbURL;
@property NSString *key;
@property NSString *path;
@property NSMutableDictionary *listeners;

- (id)initWithPathAndModifiers:(id<EXEventEmitterService>)emitter appDisplayName:(NSString *)appDisplayName dbURL:(NSString *)dbURL key:(NSString *)key refPath:(NSString *)refPath modifiers:(NSArray *)modifiers;
- (void)on:(NSString *) eventName registration:(NSDictionary *) registration;
- (void)once:(NSString *) eventType resolver:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
- (void)removeEventListener:(NSString *)eventRegistrationKey;
- (BOOL)hasListeners;
+ (NSDictionary *)snapshotToDict:(FIRDataSnapshot *)dataSnapshot;

@end
