#import <EXFirebaseFirestore/EXFirebaseFirestoreDocumentReference.h>
#import <EXCore/EXUtilities.h>
@implementation EXFirebaseFirestoreDocumentReference

static NSMutableDictionary *_listeners;

- (id)initWithPath:(id<EXEventEmitterService>)emitter
    appDisplayName:(NSString *)appDisplayName
              path:(NSString *)path
{
    self = [super init];
    if (self) {
        _emitter = emitter;
        _appDisplayName = appDisplayName;
        _path = path;
        _ref = [[EXFirebaseFirestore getFirestoreForApp:_appDisplayName] documentWithPath:_path];
    }
    // Initialise the static listeners object if required
    if (!_listeners) {
        _listeners = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (void)delete:(EXPromiseResolveBlock)resolve
      rejecter:(EXPromiseRejectBlock)reject
{
    [_ref deleteDocumentWithCompletion:^(NSError * _Nullable error) {
        [EXFirebaseFirestoreDocumentReference handleWriteResponse:error resolver:resolve rejecter:reject];
    }];
}

- (void)get:(NSDictionary *)getOptions
   resolver:(EXPromiseResolveBlock)resolve
   rejecter:(EXPromiseRejectBlock)reject
{
    FIRFirestoreSource source;
    if (getOptions && getOptions[@"source"]) {
        if ([getOptions[@"source"] isEqualToString:@"server"]) {
            source = FIRFirestoreSourceServer;
        } else if ([getOptions[@"source"] isEqualToString:@"cache"]) {
            source = FIRFirestoreSourceCache;
        } else {
            source = FIRFirestoreSourceDefault;
        }
    } else {
        source = FIRFirestoreSourceDefault;
    }
    [_ref getDocumentWithSource:source completion:^(FIRDocumentSnapshot * _Nullable snapshot, NSError * _Nullable error) {
        if (error) {
            [EXFirebaseFirestore promiseRejectException:reject error:error];
        } else {
            NSDictionary *data = [EXFirebaseFirestoreDocumentReference snapshotToDictionary:snapshot];
            resolve(data);
        }
    }];
}

+ (void)offSnapshot:(NSString *)listenerId
{
    id<FIRListenerRegistration> listener = _listeners[listenerId];
    if (listener) {
        [_listeners removeObjectForKey:listenerId];
        [listener remove];
    }
}

- (void)onSnapshot:(NSString *)listenerId
  docListenOptions:(NSDictionary *)docListenOptions
{
    if (_listeners[listenerId] == nil) {
        id listenerBlock = ^(FIRDocumentSnapshot * _Nullable snapshot, NSError * _Nullable error) {
            if (error) {
                id<FIRListenerRegistration> listener = _listeners[listenerId];
                if (listener) {
                    [_listeners removeObjectForKey:listenerId];
                    [listener remove];
                }
                [self handleDocumentSnapshotError:listenerId error:error];
            } else {
                [self handleDocumentSnapshotEvent:listenerId documentSnapshot:snapshot];
            }
        };
        bool includeMetadataChanges;
        if (docListenOptions && docListenOptions[@"includeMetadataChanges"]) {
            includeMetadataChanges = true;
        } else {
            includeMetadataChanges = false;
        }
        id<FIRListenerRegistration> listener = [_ref addSnapshotListenerWithIncludeMetadataChanges:includeMetadataChanges listener:listenerBlock];
        _listeners[listenerId] = listener;
    }
}

- (void)set:(NSDictionary *)data
    options:(NSDictionary *)options
   resolver:(EXPromiseResolveBlock)resolve
   rejecter:(EXPromiseRejectBlock)reject {
    NSDictionary *dictionary = [EXFirebaseFirestoreDocumentReference parseJSMap:[EXFirebaseFirestore getFirestoreForApp:_appDisplayName] jsMap:data];
    if (options && options[@"merge"]) {
        [_ref setData:dictionary merge:true completion:^(NSError * _Nullable error) {
            [EXFirebaseFirestoreDocumentReference handleWriteResponse:error resolver:resolve rejecter:reject];
        }];
    } else {
        [_ref setData:dictionary completion:^(NSError * _Nullable error) {
            [EXFirebaseFirestoreDocumentReference handleWriteResponse:error resolver:resolve rejecter:reject];
        }];
    }
}

- (void)update:(NSDictionary *)data
      resolver:(EXPromiseResolveBlock)resolve
      rejecter:(EXPromiseRejectBlock)reject {
    NSDictionary *dictionary = [EXFirebaseFirestoreDocumentReference parseJSMap:[EXFirebaseFirestore getFirestoreForApp:_appDisplayName] jsMap:data];
    [_ref updateData:dictionary completion:^(NSError * _Nullable error) {
        [EXFirebaseFirestoreDocumentReference handleWriteResponse:error resolver:resolve rejecter:reject];
    }];
}

- (BOOL)hasListeners
{
    return [[_listeners allKeys] count] > 0;
}

+ (void)handleWriteResponse:(NSError *)error
                   resolver:(EXPromiseResolveBlock)resolve
                   rejecter:(EXPromiseRejectBlock)reject
{
    if (error) {
        [EXFirebaseFirestore promiseRejectException:reject error:error];
    } else {
        resolve(nil);
    }
}

+ (NSDictionary *)snapshotToDictionary:(FIRDocumentSnapshot *)documentSnapshot
{
    NSMutableDictionary *snapshot = [[NSMutableDictionary alloc] init];
    [snapshot setValue:documentSnapshot.reference.path forKey:@"path"];
    if (documentSnapshot.exists) {
        [snapshot setValue:[EXFirebaseFirestoreDocumentReference buildNativeMap:documentSnapshot.data] forKey:@"data"];
    }
    if (documentSnapshot.metadata) {
        NSMutableDictionary *metadata = [[NSMutableDictionary alloc] init];
        [metadata setValue:@(documentSnapshot.metadata.fromCache) forKey:@"fromCache"];
        [metadata setValue:@(documentSnapshot.metadata.hasPendingWrites) forKey:@"hasPendingWrites"];
        [snapshot setValue:metadata forKey:@"metadata"];
    }
    return snapshot;
}

- (void)handleDocumentSnapshotError:(NSString *)listenerId
                              error:(NSError *)error
{
    NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
    [event setValue:_appDisplayName forKey:@"appName"];
    [event setValue:_path forKey:@"path"];
    [event setValue:listenerId forKey:@"listenerId"];
    [event setValue:[EXFirebaseFirestore getJSError:error] forKey:@"error"];

    [EXFirebaseAppUtil sendJSEvent:self.emitter name:FIRESTORE_DOCUMENT_SYNC_EVENT body:event];
}

- (void)handleDocumentSnapshotEvent:(NSString *)listenerId
                   documentSnapshot:(FIRDocumentSnapshot *)documentSnapshot
{
    NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
    [event setValue:_appDisplayName forKey:@"appName"];
    [event setValue:_path forKey:@"path"];
    [event setValue:listenerId forKey:@"listenerId"];
    [event setValue:[EXFirebaseFirestoreDocumentReference snapshotToDictionary:documentSnapshot] forKey:@"documentSnapshot"];

    [EXFirebaseAppUtil sendJSEvent:self.emitter name:FIRESTORE_DOCUMENT_SYNC_EVENT body:event];
}


+ (NSDictionary *)buildNativeMap:(NSDictionary *)nativeMap
{
    NSMutableDictionary *map = [[NSMutableDictionary alloc] init];
    [nativeMap enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
        NSDictionary *typeMap = [EXFirebaseFirestoreDocumentReference buildTypeMap:obj];
        map[key] = typeMap;
    }];

    return map;
}

+ (NSArray *)buildNativeArray:(NSArray *)nativeArray
{
    NSMutableArray *array = [[NSMutableArray alloc] init];
    [nativeArray enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        NSDictionary *typeMap = [EXFirebaseFirestoreDocumentReference buildTypeMap:obj];
        [array addObject:typeMap];
    }];

    return array;
}

+ (NSDictionary *)buildTypeMap:(id)value
{
    NSMutableDictionary *typeMap = [[NSMutableDictionary alloc] init];
    if (!value) {
        typeMap[@"type"] = @"null";
    } else if ([value isKindOfClass:[NSString class]]) {
        typeMap[@"type"] = @"string";
        typeMap[@"value"] = value;
    } else if ([value isKindOfClass:[NSDictionary class]]) {
        typeMap[@"type"] = @"object";
        typeMap[@"value"] = [EXFirebaseFirestoreDocumentReference buildNativeMap:value];
    } else if ([value isKindOfClass:[NSArray class]]) {
        typeMap[@"type"] = @"array";
        typeMap[@"value"] = [EXFirebaseFirestoreDocumentReference buildNativeArray:value];
    } else if ([value isKindOfClass:[FIRDocumentReference class]]) {
        typeMap[@"type"] = @"reference";
        FIRDocumentReference *ref = (FIRDocumentReference *)value;
        typeMap[@"value"] = [ref path];
    } else if ([value isKindOfClass:[FIRGeoPoint class]]) {
        typeMap[@"type"] = @"geopoint";
        FIRGeoPoint *point = (FIRGeoPoint *)value;
        NSMutableDictionary *geopoint = [[NSMutableDictionary alloc] init];
        geopoint[@"latitude"] = @([point latitude]);
        geopoint[@"longitude"] = @([point longitude]);
        typeMap[@"value"] = geopoint;
    } else if ([value isKindOfClass:[NSDate class]]) {
        typeMap[@"type"] = @"date";
        // NOTE: The round() is important as iOS ends up giving .999 otherwise,
        // and loses a millisecond when going between native and JS
        typeMap[@"value"] = @(round([(NSDate *)value timeIntervalSince1970] * 1000.0));
    } else if ([value isKindOfClass:[NSNumber class]]) {
        NSNumber *number = (NSNumber *)value;
        if (number == (void*)kCFBooleanFalse || number == (void*)kCFBooleanTrue) {
            typeMap[@"type"] = @"boolean";
        } else {
            typeMap[@"type"] = @"number";
        }
        typeMap[@"value"] = value;
    } else if ([value isKindOfClass:[NSData class]]) {
        typeMap[@"type"] = @"blob";
        NSData *blob = (NSData *)value;
        typeMap[@"value"] = [blob base64EncodedStringWithOptions:0];
    } else {
        // TODO: Log an error
        typeMap[@"type"] = @"null";
    }

    return typeMap;
}

+ (NSDictionary *)parseJSMap:(FIRFirestore *)firestore
                      jsMap:(NSDictionary *)jsMap
{
    NSMutableDictionary* map = [[NSMutableDictionary alloc] init];
    if (jsMap) {
        [jsMap enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
            map[key] = [EXFirebaseFirestoreDocumentReference parseJSTypeMap:firestore jsTypeMap:obj];
        }];
    }
    return map;
}

+ (NSArray *)parseJSArray:(FIRFirestore *)firestore
                 jsArray:(NSArray *)jsArray
{
    NSMutableArray* array = [[NSMutableArray alloc] init];
    if (jsArray) {
        [jsArray enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
            [array addObject:[EXFirebaseFirestoreDocumentReference parseJSTypeMap:firestore jsTypeMap:obj]];
        }];
    }
    return array;
}

+ (id)parseJSTypeMap:(FIRFirestore *)firestore
          jsTypeMap:(NSDictionary *)jsTypeMap
{
    NSString *type = jsTypeMap[@"type"];
    id value = jsTypeMap[@"value"];
    if ([type isEqualToString:@"array"]) {
        return [EXFirebaseFirestoreDocumentReference parseJSArray:firestore jsArray:value];
    } else if ([type isEqualToString:@"object"]) {
        return [EXFirebaseFirestoreDocumentReference parseJSMap:firestore jsMap:value];
    } else if ([type isEqualToString:@"reference"]) {
        return [firestore documentWithPath:value];
    } else if ([type isEqualToString:@"blob"]) {
        return [[NSData alloc] initWithBase64EncodedString:(NSString *) value options:0];
    } else if ([type isEqualToString:@"geopoint"]) {
        NSDictionary *geopoint = (NSDictionary*)value;
        NSNumber *latitude = geopoint[@"latitude"];
        NSNumber *longitude = geopoint[@"longitude"];
        return [[FIRGeoPoint alloc] initWithLatitude:[latitude doubleValue] longitude:[longitude doubleValue]];
    } else if ([type isEqualToString:@"date"]) {
        return [NSDate dateWithTimeIntervalSince1970:([(NSNumber *)value doubleValue] / 1000.0)];
    } else if ([type isEqualToString:@"documentid"]) {
        return [FIRFieldPath documentID];
    } else if ([type isEqualToString:@"fieldvalue"]) {
        NSString *string = (NSString*)value;
        if ([string isEqualToString:@"delete"]) {
            return [FIRFieldValue fieldValueForDelete];
        } else if ([string isEqualToString:@"timestamp"]) {
            return [FIRFieldValue fieldValueForServerTimestamp];
        } else {
            // TODO: Log warning
            return nil;
        }
    } else if ([type isEqualToString:@"boolean"] || [type isEqualToString:@"number"] || [type isEqualToString:@"string"] || [type isEqualToString:@"null"]) {
        return value;
    } else {
        // TODO: Log error
        return nil;
    }
}

@end
