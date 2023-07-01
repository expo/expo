// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXSecureStore/ABI49_0_0EXSecureStore.h>)
#import "ABI49_0_0EXScopedSecureStore.h"

@interface ABI49_0_0EXSecureStore (Protected)

- (NSString *)validatedKey:(NSString *)key;
- (NSData *)_searchKeychainWithKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error;
- (BOOL)_setValue:(NSString *)value withKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error;
- (void)_deleteValueWithKey:(NSString *)key withOptions:(NSDictionary *)options;
+ (NSString *) _messageForError:(NSError *)error;

@end

@interface ABI49_0_0EXScopedSecureStore ()

@property (strong, nonatomic) NSString *scopeKey;
@property (nonatomic) BOOL isStandaloneApp;

@end

@implementation ABI49_0_0EXScopedSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(ABI49_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _isStandaloneApp = ![@"expo" isEqualToString:constantsBinding.appOwnership];
  }
  return self;
}

- (NSString *)validatedKey:(NSString *)key {
  if (![super validatedKey:key]) {
    return nil;
  }

  return _isStandaloneApp ? key : [NSString stringWithFormat:@"%@-%@", _scopeKey, key];
}

// We must override this method so that items saved in standalone apps on SDK 40 and below,
// which were scoped by prefixing the validated key with the scopeKey, can still be
// found in SDK 41 and up. This override can be removed in SDK 45.
- (NSString *)_getValueWithKey:(NSString *)key
                   withOptions:(NSDictionary *)options
                         error:(NSError **)error __deprecated_msg("To be removed once SDK 41 is phased out")
{
  NSError *searchError;
  NSData *data = [self _searchKeychainWithKey:key
                                  withOptions:options
                                        error:&searchError];
  if (data) {
    NSString *value = [[NSString alloc] initWithData:data
                                            encoding:NSUTF8StringEncoding];
    return value;
  } else if (_isStandaloneApp) {
    NSString *scopedKey = [NSString stringWithFormat:@"%@-%@", _scopeKey, key];
    NSString *scopedValue = [self getValueWithScopedKey:scopedKey
                                             withOptions:options];
    if (scopedValue) {
      [self migrateValue:scopedValue
            fromScopedKey:scopedKey
                 toNewKey:key
              withOptions:options];
      return scopedValue;
    }
    // If we don't find anything under the scopedKey, we want to return
    // the original error from searching for the unscoped key.
  }

  *error = searchError;
  return nil;
}

- (NSString *)getValueWithScopedKey:(NSString *)scopedKey withOptions:(NSDictionary *)options
{
  NSError *searchError;
  NSData *data = [self _searchKeychainWithKey:scopedKey
                                  withOptions:options
                                        error:&searchError];
  if (data) {
    NSString *value = [[NSString alloc] initWithData:data
                                            encoding:NSUTF8StringEncoding];
    return value;
  }
  return nil;
}

- (void)migrateValue:(NSString *)value
       fromScopedKey:(NSString *)scopedKey
            toNewKey:(NSString *)newKey
         withOptions:(NSDictionary *)options
{
  // Migrate the value to unscoped storage, then delete the legacy
  // value if successful.
  NSError *error;
  BOOL setValue = [self _setValue:value
                          withKey:newKey
                      withOptions:options
                            error:&error];
  if (setValue) {
    [self _deleteValueWithKey:scopedKey
                  withOptions:options];
  } else {
    ABI49_0_0EXLogWarn(@"Encountered an error while saving SecureStore data: %@.", [[super class] _messageForError:error]);
  }
}

@end
#endif
