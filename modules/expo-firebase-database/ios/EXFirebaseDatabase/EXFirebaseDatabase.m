

#import <EXFirebaseDatabase/EXFirebaseDatabase.h>
#import <Firebase.h>
#import <EXFirebaseDatabase/EXFirebaseDatabaseReference.h>
#import <EXFirebaseApp/EXFirebaseAppEvents.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <EXCore/EXUtilities.h>
@interface EXFirebaseDatabase ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXFirebaseDatabase
EX_EXPORT_MODULE(ExpoFirebaseDatabase);

// Run on a different thread
- (dispatch_queue_t)methodQueue {
  return dispatch_queue_create("expo.modules.firebase.database", DISPATCH_QUEUE_SERIAL);
}

- (id)init {
  self = [super init];
  if (self != nil) {
    _dbReferences = [[NSMutableDictionary alloc] init];
    _transactions = [[NSMutableDictionary alloc] init];
    _transactionQueue = dispatch_queue_create("expo.modules.firebase.database.transactions", DISPATCH_QUEUE_CONCURRENT);
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

- (void)stopObserving {
  
}

EX_EXPORT_METHOD_AS(goOnline,
                    goOnline:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabase *database = [EXFirebaseDatabase getDatabaseForApp:appDisplayName URL:dbURL];
  if (!database) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [database goOnline];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(goOffline,
                    goOffline:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabase *database = [EXFirebaseDatabase getDatabaseForApp:appDisplayName URL:dbURL];
  if (!database) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [database goOffline];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setPersistence,
                    setPersistence:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    state:(BOOL)state
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabase *database = [EXFirebaseDatabase getDatabaseForApp:appDisplayName URL:dbURL];
  if (!database) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  database.persistenceEnabled = state;
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setPersistenceCacheSizeBytes,
                    setPersistenceCacheSizeBytes:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    size:(NSInteger *)size
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabase *database = [EXFirebaseDatabase getDatabaseForApp:appDisplayName URL:dbURL];
  if (!database) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  database.persistenceCacheSizeBytes = (NSUInteger)size;
  resolve(nil);
}

EX_EXPORT_METHOD_AS(enableLogging,
                    enableLogging:(BOOL)enabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [FIRDatabase setLoggingEnabled:enabled];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(keepSynced,
                    keepSynced:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    key:(NSString *)key
                    path:(NSString *)path
                    modifiers:(NSArray *)modifiers
                    state:(BOOL)state
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseQuery *query = [self getInternalReferenceForApp:appDisplayName dbURL:dbURL key:key path:path modifiers:modifiers].query;
  [query keepSynced:state];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(transactionTryCommit,
                    transactionTryCommit:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    transactionId:(nonnull NSNumber *)transactionId
                    updates:(NSDictionary *)updates
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  __block NSMutableDictionary *transactionState;
  
  dispatch_sync(_transactionQueue, ^{
    transactionState = self->_transactions[[transactionId stringValue]];
  });
  
  if (!transactionState) {
    NSLog(@"tryCommitTransaction for unknown ID %@", transactionId);
    return;
  }
  
  dispatch_semaphore_t sema = [transactionState valueForKey:@"semaphore"];
  
  BOOL abort = [[updates valueForKey:@"abort"] boolValue];
  
  if (abort) {
    [transactionState setValue:@true forKey:@"abort"];
  } else {
    id newValue = [updates valueForKey:@"value"];
    [transactionState setValue:newValue forKey:@"value"];
  }
  
  dispatch_semaphore_signal(sema);
  resolve(nil);
}

EX_EXPORT_METHOD_AS(transactionStart,
                    transactionStart:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    transactionId:(nonnull NSNumber *)transactionId
                    applyLocally:(BOOL)applyLocally
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  dispatch_async(_transactionQueue, ^{
    NSMutableDictionary *transactionState = [NSMutableDictionary new];
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);
    transactionState[@"semaphore"] = sema;
    FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
    if (!ref) {
      reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
      return;
    }
    
    [ref runTransactionBlock:^FIRTransactionResult *_Nonnull (FIRMutableData *_Nonnull currentData) {
      dispatch_barrier_async(self->_transactionQueue, ^{
        [self->_transactions setValue:transactionState forKey:[transactionId stringValue]];
        NSDictionary *updateMap = [self createTransactionUpdateMap:appDisplayName dbURL:dbURL transactionId:transactionId updatesData:currentData];
        [EXFirebaseAppUtil sendJSEvent:self->_eventEmitter name:DATABASE_TRANSACTION_EVENT body:updateMap];
      });
      
      // wait for the js event handler to call tryCommitTransaction
      // this wait occurs on the Firebase Worker Queue
      // so if the tryCommitTransaction fails to signal the semaphore
      // no further blocks will be executed by Firebase until the timeout expires
      dispatch_time_t delayTime = dispatch_time(DISPATCH_TIME_NOW, 30 * NSEC_PER_SEC);
      BOOL timedout = dispatch_semaphore_wait(sema, delayTime) != 0;
      
      BOOL abort = [transactionState valueForKey:@"abort"] || timedout;
      id value = [transactionState valueForKey:@"value"];
      
      dispatch_barrier_async(self->_transactionQueue, ^{
        [self->_transactions removeObjectForKey:[transactionId stringValue]];
      });
      
      if (abort) {
        return [FIRTransactionResult abort];
      } else {
        currentData.value = value;
        return [FIRTransactionResult successWithValue:currentData];
      }
    } andCompletionBlock:^(NSError *_Nullable databaseError, BOOL committed, FIRDataSnapshot *_Nullable snapshot) {
      NSDictionary *resultMap = [self createTransactionResultMap:appDisplayName dbURL:dbURL transactionId:transactionId error:databaseError committed:committed snapshot:snapshot];
      [EXFirebaseAppUtil sendJSEvent:self->_eventEmitter name:DATABASE_TRANSACTION_EVENT body:resultMap];
    } withLocalEvents:applyLocally];
  });
  resolve(nil);
}

EX_EXPORT_METHOD_AS(onDisconnectSet,
                    onDisconnectSet:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref onDisconnectSetValue:props[@"value"] withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(onDisconnectUpdate,
                    onDisconnectUpdate:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref onDisconnectUpdateChildValues:props withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(onDisconnectRemove,
                    onDisconnectRemove:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref onDisconnectRemoveValueWithCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(onDisconnectCancel,
                    onDisconnectCancel:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref cancelDisconnectOperationsWithCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(set,
                    set:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref setValue:[props valueForKey:@"value"] withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(setPriority,
                    setPriority:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    priority:(NSDictionary *)priority
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref setPriority:[priority valueForKey:@"value"] withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(setWithPriority,
                    setWithPriority:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    data:(NSDictionary *)data
                    priority:(NSDictionary *)priority
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref setValue:[data valueForKey:@"value"] andPriority:[priority valueForKey:@"value"] withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(update,
                    update:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref updateChildValues:props withCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(remove,
                    remove:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRDatabaseReference *ref = [self getReferenceForAppPath:appDisplayName dbURL:dbURL path:path];
  if (!ref) {
    reject(@"E_FIREBASE_DATABASE", [NSString stringWithFormat:@"No database named %@", appDisplayName], nil);
    return;
  }
  [ref removeValueWithCompletionBlock:^(NSError *_Nullable error, FIRDatabaseReference *_Nonnull _ref) {
    [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
  }];
}

EX_EXPORT_METHOD_AS(once,
                    once:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    key:(NSString *)key
                    path:(NSString *)path
                    modifiers:(NSArray *)modifiers
                    eventName:(NSString *)eventName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseDatabaseReference *ref = [self getInternalReferenceForApp:appDisplayName dbURL:dbURL key:key path:path modifiers:modifiers];
  [ref once:eventName resolver:resolve rejecter:reject];
}

EX_EXPORT_METHOD_AS(on,
                    on:(NSString *)appDisplayName
                    dbURL:(NSString *)dbURL
                    props:(NSDictionary *)props
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseDatabaseReference *ref = [self getCachedInternalReferenceForApp:appDisplayName dbURL:dbURL props:props];
  [ref on:props[@"eventType"] registration:props[@"registration"]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(off,
                    off:(NSString *)key
                    eventRegistrationKey:(NSString *)eventRegistrationKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  EXFirebaseDatabaseReference *ref = _dbReferences[key];
  if (ref) {
    [ref removeEventListener:eventRegistrationKey];
    
    if (![ref hasListeners]) {
      [_dbReferences removeObjectForKey:key];
    }
  }
  resolve(nil);
}

/*
 * INTERNALS/UTILS
 */
+ (void)handlePromise:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject databaseError:(NSError *)databaseError {
  if (databaseError != nil) {
    NSDictionary *jsError = [EXFirebaseDatabase getJSError:databaseError];
    reject([jsError valueForKey:@"code"], [jsError valueForKey:@"message"], databaseError);
  } else {
    resolve(nil);
  }
}

+ (FIRDatabase *)getDatabaseForApp:(NSString *)appDisplayName {
  FIRApp *app = [EXFirebaseAppUtil getApp:appDisplayName];
  return [FIRDatabase databaseForApp:app];
}

+ (FIRDatabase *)getDatabaseForApp:(NSString *)appDisplayName URL:(NSString *)url {
  if (url == nil) {
    return [self getDatabaseForApp:appDisplayName];
  }
  FIRApp *app = [EXFirebaseAppUtil getApp:appDisplayName];
  if (app == nil) {
    return nil;
  }
  return [FIRDatabase databaseForApp:app URL:url];
}

- (FIRDatabaseReference *)getReferenceForAppPath:(NSString *)appDisplayName dbURL:(NSString *)dbURL path:(NSString *)path {
  FIRDatabase *database = [EXFirebaseDatabase getDatabaseForApp:appDisplayName URL:dbURL];
  if (!database) {
    return nil;
  }
  
  __block FIRDatabaseReference *ref;
  [EXUtilities performSynchronouslyOnMainThread:^{
    ref = [database referenceWithPath:path];
  }];
  return ref;
}

- (EXFirebaseDatabaseReference *)getInternalReferenceForApp:(NSString *)appDisplayName dbURL:(NSString *)dbURL key:(NSString *)key path:(NSString *)path modifiers:(NSArray *)modifiers {
  __block EXFirebaseDatabaseReference *ref;
  [EXUtilities performSynchronouslyOnMainThread:^{
    ref = [[EXFirebaseDatabaseReference alloc] initWithPathAndModifiers:self->_eventEmitter appDisplayName:appDisplayName dbURL:dbURL key:key refPath:path modifiers:modifiers];
  }];
  return ref;
}

- (EXFirebaseDatabaseReference *)getCachedInternalReferenceForApp:(NSString *)appDisplayName dbURL:(NSString *)dbURL props:(NSDictionary *)props {
  NSString *key = props[@"key"];
  NSString *path = props[@"path"];
  NSArray *modifiers = props[@"modifiers"];
  
  __block EXFirebaseDatabaseReference *ref = _dbReferences[key];
  
  if (ref == nil) {
    [EXUtilities performSynchronouslyOnMainThread:^{
      ref = [[EXFirebaseDatabaseReference alloc] initWithPathAndModifiers:self->_eventEmitter appDisplayName:appDisplayName dbURL:dbURL key:key refPath:path modifiers:modifiers];
      self->_dbReferences[key] = ref;
    }];
  }
  return ref;
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
  NSString *service = @"Database";
  
  switch (nativeError.code) {
      // iOS confirmed codes
    case 1: // -3 on Android
      code = [EXFirebaseDatabase getCodeWithService:service code:@"permission-denied"];
      message = [EXFirebaseDatabase getMessageWithService:@"Client doesn't have permission to access the desired data." service:service fullCode:code];
      break;
    case 2: // -10 on Android
      code = [EXFirebaseDatabase getCodeWithService:service code:@"unavailable"];
      message = [EXFirebaseDatabase getMessageWithService:@"The service is unavailable." service:service fullCode:code];
      break;
    case 3: // -25 on Android
      code = [EXFirebaseDatabase getCodeWithService:service code:@"write-cancelled"];
      message = [EXFirebaseDatabase getMessageWithService:@"The write was canceled by the user." service:service fullCode:code];
      break;
      
      // TODO: Missing iOS equivalent codes
    case -1:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"data-stale"];
      message = [EXFirebaseDatabase getMessageWithService:@"The transaction needs to be run again with current data." service:service fullCode:code];
      break;
    case -2:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"failure"];
      message = [EXFirebaseDatabase getMessageWithService:@"The server indicated that this operation failed." service:service fullCode:code];
      break;
    case -4:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"disconnected"];
      message = [EXFirebaseDatabase getMessageWithService:@"The operation had to be aborted due to a network disconnect." service:service fullCode:code];
      break;
    case -6:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"expired-token"];
      message = [EXFirebaseDatabase getMessageWithService:@"The supplied auth token has expired." service:service fullCode:code];
      break;
    case -7:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"invalid-token"];
      message = [EXFirebaseDatabase getMessageWithService:@"The supplied auth token was invalid." service:service fullCode:code];
      break;
    case -8:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"max-retries"];
      message = [EXFirebaseDatabase getMessageWithService:@"The transaction had too many retries." service:service fullCode:code];
      break;
    case -9:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"overridden-by-set"];
      message = [EXFirebaseDatabase getMessageWithService:@"The transaction was overridden by a subsequent set." service:service fullCode:code];
      break;
    case -11:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"user-code-exception"];
      message = [EXFirebaseDatabase getMessageWithService:@"User code called from the Firebase Database runloop threw an exception." service:service fullCode:code];
      break;
    case -24:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"network-error"];
      message = [EXFirebaseDatabase getMessageWithService:@"The operation could not be performed due to a network error." service:service fullCode:code];
      break;
    default:
      code = [EXFirebaseDatabase getCodeWithService:service code:@"unknown"];
      message = [EXFirebaseDatabase getMessageWithService:@"An unknown error occurred." service:service fullCode:code];
      break;
  }
  
  [errorMap setValue:code forKey:@"code"];
  [errorMap setValue:message forKey:@"message"];
  
  return errorMap;
}

- (NSDictionary *)createTransactionUpdateMap:(NSString *)appDisplayName dbURL:(NSString *)dbURL transactionId:(NSNumber *)transactionId updatesData:(FIRMutableData *)updatesData {
  NSMutableDictionary *updatesMap = [[NSMutableDictionary alloc] init];
  [updatesMap setValue:transactionId forKey:@"id"];
  [updatesMap setValue:@"update" forKey:@"type"];
  [updatesMap setValue:appDisplayName forKey:@"appName"];
  [updatesMap setValue:dbURL forKey:@"dbURL"];
  [updatesMap setValue:updatesData.value forKey:@"value"];
  
  return updatesMap;
}

- (NSDictionary *)createTransactionResultMap:(NSString *)appDisplayName dbURL:(NSString *)dbURL transactionId:(NSNumber *)transactionId error:(NSError *)error committed:(BOOL)committed snapshot:(FIRDataSnapshot *)snapshot {
  NSMutableDictionary *resultMap = [[NSMutableDictionary alloc] init];
  [resultMap setValue:transactionId forKey:@"id"];
  [resultMap setValue:appDisplayName forKey:@"appName"];
  [resultMap setValue:dbURL forKey:@"dbURL"];
  // TODO: no timeout on iOS
  [resultMap setValue:@(committed) forKey:@"committed"];
  // TODO: no interrupted on iOS
  if (error != nil) {
    [resultMap setValue:@"error" forKey:@"type"];
    [resultMap setValue:[EXFirebaseDatabase getJSError:error] forKey:@"error"];
    // TODO: timeout error on iOS
  } else {
    [resultMap setValue:@"complete" forKey:@"type"];
    [resultMap setValue:[EXFirebaseDatabaseReference snapshotToDict:snapshot] forKey:@"snapshot"];
  }
  
  return resultMap;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[DATABASE_SYNC_EVENT, DATABASE_TRANSACTION_EVENT];
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
