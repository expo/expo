

#import <EXFirebaseFirestore/EXFirebaseFirestoreDocumentReference.h>
#import <EXFirebaseFirestore/EXFirebaseFirestoreCollectionReference.h>
#import <EXFirebaseFirestore/EXFirebaseFirestore.h>
#import <Firebase.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>

@interface EXFirebaseFirestore ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXFirebaseFirestore

EX_EXPORT_MODULE(ExpoFirebaseFirestore);

static dispatch_queue_t firestoreQueue;
static NSMutableDictionary* initialisedApps;

+ (dispatch_queue_t)getQueue
{
  if (!firestoreQueue) {
    firestoreQueue = dispatch_queue_create("expo.modules.firebase.firestore", DISPATCH_QUEUE_SERIAL);
  }
  return firestoreQueue;
}
// Run on a different thread
- (dispatch_queue_t)methodQueue {
    return [EXFirebaseFirestore getQueue];
}

- (id)init {
    self = [super init];
    if (self != nil) {
        initialisedApps = [[NSMutableDictionary alloc] init];
        _transactions = [[NSMutableDictionary alloc] init];
        _transactionQueue = dispatch_queue_create("expo.modules.firebase.firestore.transactions", DISPATCH_QUEUE_CONCURRENT);
    }
    return self;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
    _moduleRegistry = moduleRegistry;
    _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

- (void)startObserving {
    
}

- (void)stopObserving
{
//  [EXFirebaseFirestoreCollectionReference destroyListeners];
}

/**
 *  TRANSACTIONS
 */

EX_EXPORT_METHOD_AS(transactionGetDocument,
                    transactionGetDocument:(NSString *)appDisplayName
                    transactionId:(nonnull NSNumber *)transactionId
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    __block NSMutableDictionary *transactionState;
    
    dispatch_sync(_transactionQueue, ^{
      transactionState = self->_transactions[[transactionId stringValue]];
    });
    
    if (!transactionState) {
        NSLog(@"transactionGetDocument called for non-existant transactionId %@", transactionId);
        return;
    }
    
    NSError *error = nil;
    FIRTransaction *transaction = [transactionState valueForKey:@"transaction"];
    FIRDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path].ref;
    FIRDocumentSnapshot *snapshot = [transaction getDocument:ref error:&error];
    
    if (error != nil) {
        [EXFirebaseFirestore promiseRejectException:reject error:error];
    } else {
        NSDictionary *snapshotDict = [EXFirebaseFirestoreDocumentReference snapshotToDictionary:snapshot];
        NSString *path = snapshotDict[@"path"];
        if (path == nil) {
            [snapshotDict setValue:ref.path forKey:@"path"];
        }
        resolve(snapshotDict);
    }
}

EX_EXPORT_METHOD_AS(transactionDispose,
                    transactionDispose:(NSString *)appDisplayName
                    transactionId:(nonnull NSNumber *)transactionId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    __block NSMutableDictionary *transactionState;
    
    dispatch_sync(_transactionQueue, ^{
      transactionState = self->_transactions[[transactionId stringValue]];
    });
    
    if (!transactionState) {
        NSLog(@"transactionGetDocument called for non-existant transactionId %@", transactionId);
        return;
    }
    
    dispatch_semaphore_t semaphore = [transactionState valueForKey:@"semaphore"];
    [transactionState setValue:@true forKey:@"abort"];
    dispatch_semaphore_signal(semaphore);
    resolve(nil);
}

EX_EXPORT_METHOD_AS(transactionApplyBuffer,
                    transactionApplyBuffer:(NSString *)appDisplayName
                    transactionId:(nonnull NSNumber *)transactionId
                    commandBuffer:(NSArray *)commandBuffer
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    __block NSMutableDictionary *transactionState;
    
    dispatch_sync(_transactionQueue, ^{
      transactionState = self->_transactions[[transactionId stringValue]];
    });
    
    if (!transactionState) {
        NSLog(@"transactionGetDocument called for non-existant transactionId %@", transactionId);
        return;
    }
    
    dispatch_semaphore_t semaphore = [transactionState valueForKey:@"semaphore"];
    [transactionState setValue:commandBuffer forKey:@"commandBuffer"];
    dispatch_semaphore_signal(semaphore);
    resolve(nil);
}

EX_EXPORT_METHOD_AS(transactionBegin,
                    transactionBegin:(NSString *)appDisplayName
                    transactionId:(nonnull NSNumber *)transactionId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    FIRFirestore *firestore = [EXFirebaseFirestore getFirestoreForApp:appDisplayName];
    __block BOOL aborted = false;
    
    dispatch_async(_transactionQueue, ^{
        NSMutableDictionary *transactionState = [NSMutableDictionary new];
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        transactionState[@"semaphore"] = semaphore;
        
        [firestore runTransactionWithBlock:^id (FIRTransaction *transaction, NSError * *errorPointer) {
            transactionState[@"transaction"] = transaction;
            
            // Build and send transaction update event
          dispatch_barrier_async(self->_transactionQueue, ^{
            [self->_transactions setValue:transactionState forKey:[transactionId stringValue]];
                NSMutableDictionary *eventMap = [NSMutableDictionary new];
                eventMap[@"type"] = @"update";
                eventMap[@"id"] = transactionId;
                eventMap[@"appName"] = appDisplayName;
                [EXFirebaseAppUtil sendJSEvent:self.eventEmitter name:FIRESTORE_TRANSACTION_EVENT body:eventMap];
            });
            
            // wait for the js event handler to call transactionApplyBuffer
            // this wait occurs on the RNFirestore Worker Queue so if transactionApplyBuffer fails to
            // signal the semaphore then no further blocks will be executed by RNFirestore until the timeout expires
            dispatch_time_t delayTime = dispatch_time(DISPATCH_TIME_NOW, 3000 * NSEC_PER_SEC);
            
            BOOL timedOut = dispatch_semaphore_wait(semaphore, delayTime) != 0;
            aborted = [transactionState valueForKey:@"abort"];
            
            // dispose of transaction dictionary
          dispatch_barrier_async(self->_transactionQueue, ^{
            [self->_transactions removeObjectForKey:[transactionId stringValue]];
            });
            
            if (aborted) {
                *errorPointer = [NSError errorWithDomain:FIRFirestoreErrorDomain code:FIRFirestoreErrorCodeAborted userInfo:@{}];
                return nil;
            }
            
            if (timedOut) {
                *errorPointer = [NSError errorWithDomain:FIRFirestoreErrorDomain code:FIRFirestoreErrorCodeDeadlineExceeded userInfo:@{}];
                return nil;
            }
            
            NSArray *commandBuffer = [transactionState valueForKey:@"commandBuffer"];
            for (NSDictionary *command in commandBuffer) {
                NSString *type = command[@"type"];
                NSString *path = command[@"path"];
                NSDictionary *data = [EXFirebaseFirestoreDocumentReference parseJSMap:firestore jsMap:command[@"data"]];
                
                FIRDocumentReference *ref = [firestore documentWithPath:path];
                
                if ([type isEqualToString:@"delete"]) {
                    [transaction deleteDocument:ref];
                } else if ([type isEqualToString:@"set"]) {
                    NSDictionary *options = command[@"options"];
                    if (options && options[@"merge"]) {
                        [transaction setData:data forDocument:ref merge:true];
                    } else {
                        [transaction setData:data forDocument:ref];
                    }
                } else if ([type isEqualToString:@"update"]) {
                    [transaction updateData:data forDocument:ref];
                }
            }
            
            return nil;
        } completion:^(id result, NSError *error) {
            if (aborted == NO) {
                NSMutableDictionary *eventMap = [NSMutableDictionary new];
                eventMap[@"id"] = transactionId;
                eventMap[@"appName"] = appDisplayName;
                
                if (error != nil) {
                    eventMap[@"type"] = @"error";
                    eventMap[@"error"] = [EXFirebaseFirestore getJSError:error];
                } else {
                    eventMap[@"type"] = @"complete";
                }
                
                [EXFirebaseAppUtil sendJSEvent:self.eventEmitter name:FIRESTORE_TRANSACTION_EVENT body:eventMap];
            }
        }];
    });
    resolve(nil);
}

/**
 *  TRANSACTIONS END
 */

EX_EXPORT_METHOD_AS(disableNetwork,
                    disableNetwork:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    FIRFirestore *firestore = [EXFirebaseFirestore getFirestoreForApp:appDisplayName];
    [firestore disableNetworkWithCompletion:^(NSError * _Nullable error) {
        if (error) {
            [EXFirebaseFirestore promiseRejectException:reject error:error];
        } else {
            resolve(nil);
        }
    }];
}

EX_EXPORT_METHOD_AS(setLogLevel,
                    setLogLevel:(NSString *)logLevel
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    if ([@"debug" isEqualToString:logLevel] || [@"error" isEqualToString:logLevel]) {
        [FIRFirestore enableLogging:true];
    } else {
        [FIRFirestore enableLogging:false];
    }
    resolve(nil);
}

EX_EXPORT_METHOD_AS(enableNetwork,
                    enableNetwork:(NSString *)appDisplayName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    FIRFirestore *firestore = [EXFirebaseFirestore getFirestoreForApp:appDisplayName];
    [firestore enableNetworkWithCompletion:^(NSError * _Nullable error) {
        if (error) {
            [EXFirebaseFirestore promiseRejectException:reject error:error];
        } else {
            resolve(nil);
        }
    }];
}

EX_EXPORT_METHOD_AS(collectionGet,
                    collectionGet:(NSString *)appDisplayName
                    path:(NSString *)path
                    filters:(NSArray *)filters
                    orders:(NSArray *)orders
                    options:(NSDictionary *)options
                    getOptions:(NSDictionary *)getOptions
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [[self getCollectionForAppPath:appDisplayName path:path filters:filters orders:orders options:options] get:getOptions resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(collectionOffSnapshot,
                    collectionOffSnapshot:(NSString *)appDisplayName
                    path:(NSString *)path
                    filters:(NSArray *)filters
                    orders:(NSArray *)orders
                    options:(NSDictionary *)options
                    listenerId:(nonnull NSString *)listenerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [EXFirebaseFirestoreCollectionReference offSnapshot:listenerId];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(collectionOnSnapshot,
                    collectionOnSnapshot:(NSString *)appDisplayName
                    path:(NSString *)path
                    filters:(NSArray *)filters
                    orders:(NSArray *)orders
                    options:(NSDictionary *)options
                    listenerId:(nonnull NSString *)listenerId
                    queryListenOptions:(NSDictionary *)queryListenOptions
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    EXFirebaseFirestoreCollectionReference *ref = [self getCollectionForAppPath:appDisplayName path:path filters:filters orders:orders options:options];
    [ref onSnapshot:listenerId queryListenOptions:queryListenOptions];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(documentBatch,
                    documentBatch:(NSString *)appDisplayName
                    writes:(NSArray *)writes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    FIRFirestore *firestore = [EXFirebaseFirestore getFirestoreForApp:appDisplayName];
    FIRWriteBatch *batch = [firestore batch];
    
    for (NSDictionary *write in writes) {
        NSString *type = write[@"type"];
        NSString *path = write[@"path"];
        NSDictionary *data = [EXFirebaseFirestoreDocumentReference parseJSMap:firestore jsMap:write[@"data"]];
        
        FIRDocumentReference *ref = [firestore documentWithPath:path];
        
        if ([type isEqualToString:@"DELETE"]) {
            batch = [batch deleteDocument:ref];
        } else if ([type isEqualToString:@"SET"]) {
            NSDictionary *options = write[@"options"];
            if (options && options[@"merge"]) {
                batch = [batch setData:data forDocument:ref merge:true];
            } else {
                batch = [batch setData:data forDocument:ref];
            }
        } else if ([type isEqualToString:@"UPDATE"]) {
            batch = [batch updateData:data forDocument:ref];
        }
    }
    
    [batch commitWithCompletion:^(NSError *_Nullable error) {
        if (error) {
            [EXFirebaseFirestore promiseRejectException:reject error:error];
        } else {
            resolve(nil);
        }
    }];
}

EX_EXPORT_METHOD_AS(documentDelete,
                    documentDelete:(NSString *)appDisplayName
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseFirestoreDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path];

    [ref delete:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(documentGet,
                    documentGet:(NSString *)appDisplayName
                    path:(NSString *)path
                    getOptions:(NSDictionary *)getOptions
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseFirestoreDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path];
  
  [ref get:getOptions resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(documentOffSnapshot,
                    documentOffSnapshot:(NSString *)appDisplayName
                    path:(NSString *)path
                    listenerId:(nonnull NSString *)listenerId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    [EXFirebaseFirestoreDocumentReference offSnapshot:listenerId];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(documentOnSnapshot,
                    documentOnSnapshot:(NSString *)appDisplayName
                    path:(NSString *)path
                    listenerId:(nonnull NSString *)listenerId
                    docListenOptions:(NSDictionary *)docListenOptions
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    EXFirebaseFirestoreDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path];
    [ref onSnapshot:listenerId docListenOptions:docListenOptions];
    resolve(nil);
}

EX_EXPORT_METHOD_AS(documentSet,
                    documentSet:(NSString *)appDisplayName
                    path:(NSString *)path
                    data:(NSDictionary *)data
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    EXFirebaseFirestoreDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path];
    [ref set:data options:options resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(documentUpdate,
                    documentUpdate:(NSString *)appDisplayName
                    path:(NSString *)path
                    data:(NSDictionary *)data
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseFirestoreDocumentReference *ref = [self getDocumentForAppPath:appDisplayName path:path];

    [ref update:data resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(settings,
                    settings:(NSString *)appDisplayName
                    settings:(NSDictionary *)settings
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
    FIRFirestore *firestore = [EXFirebaseFirestore getFirestoreForApp:appDisplayName];
    FIRFirestoreSettings *firestoreSettings = [[FIRFirestoreSettings alloc] init];
    
    // Make sure the dispatch queue is set correctly
    firestoreSettings.dispatchQueue = [EXFirebaseFirestore getQueue];
    
    // Apply the settings passed by the user, or ensure that the current settings are preserved
    if (settings[@"host"]) {
        firestoreSettings.host = settings[@"host"];
    } else {
        firestoreSettings.host = firestore.settings.host;
    }
    if (settings[@"persistence"]) {
        firestoreSettings.persistenceEnabled = settings[@"persistence"];
    } else {
        firestoreSettings.persistenceEnabled = firestore.settings.persistenceEnabled;
    }
    if (settings[@"ssl"]) {
        firestoreSettings.sslEnabled = settings[@"ssl"];
    } else {
        firestoreSettings.sslEnabled = firestore.settings.sslEnabled;
    }
    if (settings[@"timestampsInSnapshots"]) {
        // TODO: Enable when available on Android
        // firestoreSettings.timestampsInSnapshotsEnabled = settings[@"timestampsInSnapshots"];
    }
    
    [firestore setSettings:firestoreSettings];
    resolve(nil);
}

/*
 * INTERNALS/UTILS
 */
+ (void)promiseRejectException:(EXPromiseRejectBlock)reject error:(NSError *)error {
    NSDictionary *jsError = [EXFirebaseFirestore getJSError:error];
    reject([jsError valueForKey:@"code"], [jsError valueForKey:@"message"], error);
}

+ (FIRFirestore *)getFirestoreForApp:(NSString *)appDisplayName {
    FIRApp *app = [EXFirebaseAppUtil getApp:appDisplayName];
    FIRFirestore *firestore = [FIRFirestore firestoreForApp:app];
    
    // This is the first time we've tried to do something on this Firestore instance
    // So we need to make sure the dispatch queue is set correctly
    if (!initialisedApps[appDisplayName]) {
        initialisedApps[appDisplayName] = @YES;
        FIRFirestoreSettings *firestoreSettings = [[FIRFirestoreSettings alloc] init];
        firestoreSettings.dispatchQueue = [EXFirebaseFirestore getQueue];
        [firestore setSettings:firestoreSettings];
    }
    return firestore;
}

- (EXFirebaseFirestoreCollectionReference *)getCollectionForAppPath:(NSString *)appDisplayName path:(NSString *)path filters:(NSArray *)filters orders:(NSArray *)orders options:(NSDictionary *)options {
    return [[EXFirebaseFirestoreCollectionReference alloc] initWithPathAndModifiers:self.eventEmitter appDisplayName:appDisplayName path:path filters:filters orders:orders options:options];
}

- (EXFirebaseFirestoreDocumentReference *)getDocumentForAppPath:(NSString *)appDisplayName path:(NSString *)path {
    return [[EXFirebaseFirestoreDocumentReference alloc] initWithPath:self.eventEmitter appDisplayName:appDisplayName path:path];
}

// TODO: Move to error util for use in other modules
+ (NSString *)getMessageWithService:(NSString *)message service:(NSString *)service fullCode:(NSString *)fullCode {
    return [NSString stringWithFormat:@"%@: %@ (%@).", service, message, [fullCode lowercaseString]];
}

+ (NSString *)getCodeWithService:(NSString *)service code:(NSString *)code {
    return [NSString stringWithFormat:@"%@/%@", [service lowercaseString], [code lowercaseString]];
}

+ (NSDictionary *)getJSError:(NSError *)nativeError {
    NSMutableDictionary *errorMap = [[NSMutableDictionary alloc] init];
    [errorMap setValue:@(nativeError.code) forKey:@"nativeErrorCode"];
    [errorMap setValue:[nativeError localizedDescription] forKey:@"nativeErrorMessage"];
    
    NSString *code;
    NSString *message;
    NSString *service = @"Firestore";
    
    switch (nativeError.code) {
        case FIRFirestoreErrorCodeOK:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"ok"];
            message = [EXFirebaseFirestore getMessageWithService:@"Ok." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeCancelled:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"cancelled"];
            message = [EXFirebaseFirestore getMessageWithService:@"The operation was cancelled." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeUnknown:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"unknown"];
            message = [EXFirebaseFirestore getMessageWithService:@"Unknown error or an error from a different error domain." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeInvalidArgument:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"invalid-argument"];
            message = [EXFirebaseFirestore getMessageWithService:@"Client specified an invalid argument." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeDeadlineExceeded:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"deadline-exceeded"];
            message = [EXFirebaseFirestore getMessageWithService:@"Deadline expired before operation could complete." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeNotFound:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"not-found"];
            message = [EXFirebaseFirestore getMessageWithService:@"Some requested document was not found." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeAlreadyExists:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"already-exists"];
            message = [EXFirebaseFirestore getMessageWithService:@"Some document that we attempted to create already exists." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodePermissionDenied:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"permission-denied"];
            message = [EXFirebaseFirestore getMessageWithService:@"The caller does not have permission to execute the specified operation." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeResourceExhausted:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"resource-exhausted"];
            message = [EXFirebaseFirestore getMessageWithService:@"Some resource has been exhausted, perhaps a per-user quota, or perhaps the entire file system is out of space." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeFailedPrecondition:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"failed-precondition"];
            message = [EXFirebaseFirestore getMessageWithService:@"Operation was rejected because the system is not in a state required for the operation`s execution." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeAborted:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"aborted"];
            message = [EXFirebaseFirestore getMessageWithService:@"The operation was aborted, typically due to a concurrency issue like transaction aborts, etc." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeOutOfRange:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"out-of-range"];
            message = [EXFirebaseFirestore getMessageWithService:@"Operation was attempted past the valid range." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeUnimplemented:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"unimplemented"];
            message = [EXFirebaseFirestore getMessageWithService:@"Operation is not implemented or not supported/enabled." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeInternal:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"internal"];
            message = [EXFirebaseFirestore getMessageWithService:@"Internal errors." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeUnavailable:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"unavailable"];
            message = [EXFirebaseFirestore getMessageWithService:@"The service is currently unavailable." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeDataLoss:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"data-loss"];
            message = [EXFirebaseFirestore getMessageWithService:@"Unrecoverable data loss or corruption." service:service fullCode:code];
            break;
        case FIRFirestoreErrorCodeUnauthenticated:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"unauthenticated"];
            message = [EXFirebaseFirestore getMessageWithService:@"The request does not have valid authentication credentials for the operation." service:service fullCode:code];
            break;
        default:
            code = [EXFirebaseFirestore getCodeWithService:service code:@"unknown"];
            message = [EXFirebaseFirestore getMessageWithService:@"An unknown error occurred." service:service fullCode:code];
            break;
    }
    
    [errorMap setValue:code forKey:@"code"];
    [errorMap setValue:message forKey:@"message"];
    
    return errorMap;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[FIRESTORE_COLLECTION_SYNC_EVENT, FIRESTORE_DOCUMENT_SYNC_EVENT, FIRESTORE_TRANSACTION_EVENT];
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

@end
