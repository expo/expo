// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSecureStore/EXSecureStore.h>)
#import "EXScopedSecureStore.h"

@interface EXSecureStore (Protected)

- (NSString *)validatedKey:(NSString *)key;
- (NSData *)_searchKeychainWithKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error;
- (BOOL)_setValue:(NSString *)value withKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error;
- (void)_deleteValueWithKey:(NSString *)key withOptions:(NSDictionary *)options;
+ (NSString *) _messageForError:(NSError *)error;

@end

@interface EXScopedSecureStore ()

@property (strong, nonatomic) NSString *scopeKey;

@end

@implementation EXScopedSecureStore

- (instancetype)initWithScopeKey:(NSString *)scopeKey
                       andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (NSString *)validatedKey:(NSString *)key {
  if (![super validatedKey:key]) {
    return nil;
  }

  return [NSString stringWithFormat:@"%@-%@", _scopeKey, key];
}

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
    EXLogWarn(@"Encountered an error while saving SecureStore data: %@.", [[super class] _messageForError:error]);
  }
}

@end
#endif
