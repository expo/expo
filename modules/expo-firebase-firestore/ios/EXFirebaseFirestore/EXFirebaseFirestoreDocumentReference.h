#import <Foundation/Foundation.h>
#import <FirebaseFirestore/FirebaseFirestore.h>
#import <EXCore/EXEventEmitterService.h>
#import <EXFirebaseFirestore/EXFirebaseFirestore.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>

@interface EXFirebaseFirestoreDocumentReference : NSObject
@property id<EXEventEmitterService> emitter;
@property NSString *appDisplayName;
@property NSString *path;
@property FIRDocumentReference *ref;

- (id)initWithPath:(id<EXEventEmitterService>)emitter appDisplayName:(NSString *)appDisplayName path:(NSString *)path;
- (void)delete:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
- (void)get:(NSDictionary *)getOptions resolver:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
+ (void)offSnapshot:(NSString *)listenerId;
- (void)onSnapshot:(NSString *)listenerId docListenOptions:(NSDictionary *) docListenOptions;
- (void)set:(NSDictionary *)data options:(NSDictionary *)options resolver:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
- (void)update:(NSDictionary *)data resolver:(EXPromiseResolveBlock) resolve rejecter:(EXPromiseRejectBlock) reject;
- (BOOL)hasListeners;
+ (NSDictionary *)snapshotToDictionary:(FIRDocumentSnapshot *)documentSnapshot;
+ (NSDictionary *)parseJSMap:(FIRFirestore *) firestore jsMap:(NSDictionary *) jsMap;
+ (NSArray *)parseJSArray:(FIRFirestore *) firestore jsArray:(NSArray *) jsArray;
+ (id)parseJSTypeMap:(FIRFirestore *) firestore jsTypeMap:(NSDictionary *) jsTypeMap;

@end
