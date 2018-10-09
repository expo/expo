#import <Foundation/Foundation.h>
#import <FirebaseFirestore/FirebaseFirestore.h>
#import <EXCore/EXEventEmitterService.h>
#import <EXFirebaseFirestore/EXFirebaseFirestore.h>
#import <EXFirebaseFirestore/EXFirebaseFirestoreDocumentReference.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>

@interface EXFirebaseFirestoreCollectionReference : NSObject
@property id<EXEventEmitterService> emitter;
@property NSString *appDisplayName;
@property NSString *path;
@property NSArray *filters;
@property NSArray *orders;
@property NSDictionary *options;
@property FIRQuery *query;

- (id)initWithPathAndModifiers:(id<EXEventEmitterService>)emitter appDisplayName:(NSString *)appDisplayName path:(NSString *)path filters:(NSArray *)filters orders:(NSArray *)orders options:(NSDictionary *)options;
- (void)get:(NSDictionary *)getOptions resolver:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
+ (void)offSnapshot:(NSString *)listenerId;
- (void)onSnapshot:(NSString *)listenerId queryListenOptions:(NSDictionary *) queryListenOptions;
+ (NSDictionary *)snapshotToDictionary:(FIRQuerySnapshot *)querySnapshot;
- (void)destroyListeners;

@end
