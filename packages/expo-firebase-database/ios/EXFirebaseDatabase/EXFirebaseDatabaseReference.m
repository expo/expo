#import <EXFirebaseDatabase/EXFirebaseDatabaseReference.h>

@implementation EXFirebaseDatabaseReference

- (id)initWithPathAndModifiers:(id<EXEventEmitterService>)emitter
                appDisplayName:(NSString *)appDisplayName
                         dbURL:(NSString *)dbURL
                           key:(NSString *)key
                       refPath:(NSString *)refPath
                     modifiers:(NSArray *)modifiers {
    self = [super init];
    if (self) {
        _emitter = emitter;
        _appDisplayName = appDisplayName;
        _dbURL = dbURL;
        _key = key;
        _path = refPath;
        _listeners = [[NSMutableDictionary alloc] init];
        _query = [self buildQueryAtPathWithModifiers:refPath modifiers:modifiers];
    }
    return self;
}

- (void)removeEventListener:(NSString *)eventRegistrationKey {
    FIRDatabaseHandle handle = (FIRDatabaseHandle)[_listeners[eventRegistrationKey] integerValue];
    if (handle) {
        [_query removeObserverWithHandle:handle];
        [_listeners removeObjectForKey:eventRegistrationKey];
    }
}

- (void)on:(NSString *)eventType registration:(NSDictionary *)registration {
    NSString *eventRegistrationKey = registration[@"eventRegistrationKey"];
    if (![self hasEventListener:eventRegistrationKey]) {
        id andPreviousSiblingKeyWithBlock = ^(FIRDataSnapshot *_Nonnull snapshot, NSString *_Nullable previousChildName) {
            [self handleDatabaseEvent:eventType registration:registration dataSnapshot:snapshot previousChildName:previousChildName];
        };
        id errorBlock = ^(NSError *_Nonnull error) {
            NSLog(@"Error onDBEvent: %@", [error debugDescription]);
            [self removeEventListener:eventRegistrationKey];
            [self handleDatabaseError:registration error:error];
        };
        FIRDataEventType firDataEventType = (FIRDataEventType)[self eventTypeFromName:eventType];
        FIRDatabaseHandle handle = [_query observeEventType:firDataEventType andPreviousSiblingKeyWithBlock:andPreviousSiblingKeyWithBlock withCancelBlock:errorBlock];
        _listeners[eventRegistrationKey] = @(handle);
    }
}

- (void)once:(NSString *)eventType
    resolver:(EXPromiseResolveBlock)resolve
    rejecter:(EXPromiseRejectBlock)reject {
    FIRDataEventType firDataEventType = (FIRDataEventType)[self eventTypeFromName:eventType];
    [_query observeSingleEventOfType:firDataEventType andPreviousSiblingKeyWithBlock:^(FIRDataSnapshot *_Nonnull snapshot, NSString *_Nullable previousChildName) {
        NSDictionary *data = [EXFirebaseDatabaseReference snapshotToDictionary:snapshot previousChildName:previousChildName];
        resolve(data);
    } withCancelBlock:^(NSError *_Nonnull error) {
        NSLog(@"Error onDBEventOnce: %@", [error debugDescription]);
        [EXFirebaseDatabase handlePromise:resolve rejecter:reject databaseError:error];
    }];
}

- (void)handleDatabaseEvent:(NSString *)eventType
               registration:(NSDictionary *)registration
               dataSnapshot:(FIRDataSnapshot *)dataSnapshot
          previousChildName:(NSString *)previousChildName {
    NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
    NSDictionary *data = [EXFirebaseDatabaseReference snapshotToDictionary:dataSnapshot previousChildName:previousChildName];

    [event setValue:data forKey:@"data"];
    [event setValue:_key forKey:@"key"];
    [event setValue:eventType forKey:@"eventType"];
    [event setValue:registration forKey:@"registration"];

    [EXFirebaseAppUtil sendJSEvent:self.emitter name:DATABASE_SYNC_EVENT body:event];
}

- (void)handleDatabaseError:(NSDictionary *)registration
                      error:(NSError *)error {
    NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
    [event setValue:_key forKey:@"key"];
    [event setValue:[EXFirebaseDatabase getJSError:error] forKey:@"error"];
    [event setValue:registration forKey:@"registration"];

    [EXFirebaseAppUtil sendJSEvent:self.emitter name:DATABASE_SYNC_EVENT body:event];
}

+ (NSDictionary *)snapshotToDictionary:(FIRDataSnapshot *)dataSnapshot
                     previousChildName:(NSString *)previousChildName {
    NSMutableDictionary *result = [[NSMutableDictionary alloc] init];
    NSDictionary *snapshot = [EXFirebaseDatabaseReference snapshotToDict:dataSnapshot];

    [result setValue:snapshot forKey:@"snapshot"];
    [result setValue:previousChildName forKey:@"previousChildName"];

    return result;
}

+ (NSDictionary *)snapshotToDict:(FIRDataSnapshot *)dataSnapshot {
    NSMutableDictionary *snapshot = [[NSMutableDictionary alloc] init];

    [snapshot setValue:dataSnapshot.key forKey:@"key"];
    [snapshot setValue:@(dataSnapshot.exists) forKey:@"exists"];
    [snapshot setValue:@(dataSnapshot.hasChildren) forKey:@"hasChildren"];
    [snapshot setValue:@(dataSnapshot.childrenCount) forKey:@"childrenCount"];
    [snapshot setValue:[EXFirebaseDatabaseReference getChildKeys:dataSnapshot] forKey:@"childKeys"];
    [snapshot setValue:dataSnapshot.priority forKey:@"priority"];
    [snapshot setValue:dataSnapshot.value forKey:@"value"];

    return snapshot;
}

+ (NSMutableArray *)getChildKeys:(FIRDataSnapshot *)snapshot {
    NSMutableArray *childKeys = [NSMutableArray array];
    if (snapshot.childrenCount > 0) {
        NSEnumerator *children = [snapshot children];
        FIRDataSnapshot *child;
        while (child = [children nextObject]) {
            [childKeys addObject:child.key];
        }
    }
    return childKeys;
}

- (FIRDatabaseQuery *)buildQueryAtPathWithModifiers:(NSString *)path
                                          modifiers:(NSArray *)modifiers {
    FIRDatabase *firebaseDatabase = [EXFirebaseDatabase getDatabaseForApp:_appDisplayName URL:_dbURL];
    FIRDatabaseQuery *query = [[firebaseDatabase reference] child:path];

    for (NSDictionary *modifier in modifiers) {
        NSString *type = [modifier valueForKey:@"type"];
        NSString *name = [modifier valueForKey:@"name"];
        if ([type isEqualToString:@"orderBy"]) {
            if ([name isEqualToString:@"orderByKey"]) {
                query = [query queryOrderedByKey];
            } else if ([name isEqualToString:@"orderByPriority"]) {
                query = [query queryOrderedByPriority];
            } else if ([name isEqualToString:@"orderByValue"]) {
                query = [query queryOrderedByValue];
            } else if ([name isEqualToString:@"orderByChild"]) {
                NSString *key = [modifier valueForKey:@"key"];
                query = [query queryOrderedByChild:key];
            }
        } else if ([type isEqualToString:@"limit"]) {
            int limit = [[modifier valueForKey:@"limit"] integerValue];
            if ([name isEqualToString:@"limitToLast"]) {
                query = [query queryLimitedToLast:limit];
            } else if ([name isEqualToString:@"limitToFirst"]) {
                query = [query queryLimitedToFirst:limit];
            }
        } else if ([type isEqualToString:@"filter"]) {
            NSString *valueType = [modifier valueForKey:@"valueType"];
            NSString *key = [modifier valueForKey:@"key"];
            id value = [self getIdValue:[modifier valueForKey:@"value"] type:valueType];
            if ([name isEqualToString:@"equalTo"]) {
                if (key != nil) {
                    query = [query queryEqualToValue:value childKey:key];
                } else {
                    query = [query queryEqualToValue:value];
                }
            } else if ([name isEqualToString:@"endAt"]) {
                if (key != nil) {
                    query = [query queryEndingAtValue:value childKey:key];
                } else {
                    query = [query queryEndingAtValue:value];
                }
            } else if ([name isEqualToString:@"startAt"]) {
                if (key != nil) {
                    query = [query queryStartingAtValue:value childKey:key];
                } else {
                    query = [query queryStartingAtValue:value];
                }
            }
        }
    }

    return query;
}

- (id)getIdValue:(NSString *)value type:(NSString *)type {
    if ([type isEqualToString:@"number"]) {
        return @(value.doubleValue);
    } else if ([type isEqualToString:@"boolean"]) {
        return @(value.boolValue);
    } else {
        return value;
    }
}

- (BOOL)hasEventListener:(NSString *)eventRegistrationKey {
    return _listeners[eventRegistrationKey] != nil;
}

- (BOOL)hasListeners {
    return [[_listeners allKeys] count] > 0;
}

- (int)eventTypeFromName:(NSString *)name {
    int eventType = FIRDataEventTypeValue;

    if ([name isEqualToString:DATABASE_VALUE_EVENT]) {
        eventType = FIRDataEventTypeValue;
    } else if ([name isEqualToString:DATABASE_CHILD_ADDED_EVENT]) {
        eventType = FIRDataEventTypeChildAdded;
    } else if ([name isEqualToString:DATABASE_CHILD_MODIFIED_EVENT]) {
        eventType = FIRDataEventTypeChildChanged;
    } else if ([name isEqualToString:DATABASE_CHILD_REMOVED_EVENT]) {
        eventType = FIRDataEventTypeChildRemoved;
    } else if ([name isEqualToString:DATABASE_CHILD_MOVED_EVENT]) {
        eventType = FIRDataEventTypeChildMoved;
    }
    return eventType;
}

@end

