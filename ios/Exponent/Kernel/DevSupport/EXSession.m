// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXSession.h"
#import "EXUnversioned.h"

NSString * const kEXSessionKeychainKey = @"host.exp.exponent.session";
NSString * const kEXSessionKeychainService = @"app";

@interface EXSession ()

@property (nonatomic, strong) NSString *session;

@end

@implementation EXSession

+ (nonnull instancetype)sharedInstance
{
  static EXSession *theSession;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theSession) {
      theSession = [[EXSession alloc] init];
    }
  });
  return theSession;
}

- (NSString * _Nullable)getSession
{
  if (_session) {
    return _session;
  }
  NSMutableDictionary *query = [NSMutableDictionary dictionaryWithDictionary:@{
                                                                               (__bridge id)kSecMatchLimit:(__bridge id)kSecMatchLimitOne,
                                                                               (__bridge id)kSecReturnData:(__bridge id)kCFBooleanTrue
                                                                               }];
  [query addEntriesFromDictionary:[self _searchQuery]];

  CFTypeRef foundDict = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &foundDict);

  if (status == noErr) {
    NSData *result = (__bridge_transfer NSData *)foundDict;
    NSString *value = [[NSString alloc] initWithData:result encoding:NSUTF8StringEncoding];
    _session = value;
    return value;
  } else {
    return nil;
  }
}

- (NSString * _Nullable)getSessionSecret
{
  NSString *session = [self getSession];
  if (!session) {
    return nil;
  }
  
  NSError *jsonError;
  id sessionJson = [NSJSONSerialization JSONObjectWithData:[session dataUsingEncoding:NSUTF8StringEncoding]
                                                   options:kNilOptions
                                                     error:&jsonError];
  if (!jsonError && [sessionJson isKindOfClass:[NSDictionary class]]) {
    id sessionSecret = ((NSDictionary *)sessionJson)[@"sessionSecret"];
    if (sessionSecret && [sessionSecret isKindOfClass:[NSString class]]) {
      return (NSString *)sessionSecret;
    }
  }
  return nil;
}

- (BOOL)saveSessionToKeychain:(NSString *)session error:(NSError **)error
{
  NSData *encodedData = [session dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *searchQuery = [self _searchQuery];
  NSDictionary *updateQuery = @{ (__bridge id)kSecValueData:encodedData };
  NSMutableDictionary *addQuery = [NSMutableDictionary dictionaryWithDictionary:searchQuery];
  [addQuery addEntriesFromDictionary:updateQuery];

  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)addQuery, NULL);

  if (status == errSecDuplicateItem) {
    status = SecItemUpdate((__bridge CFDictionaryRef)searchQuery, (__bridge CFDictionaryRef)updateQuery);
  }

  if (status == errSecSuccess) {
    _session = session;
    return YES;
  } else {
    if (error) {
      * error = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain")
                                    code:-1
                                userInfo:@{ NSLocalizedDescriptionKey: @"Could not save session to keychain" }];
    }
    return NO;
  }
}

- (BOOL)deleteSessionFromKeychainWithError:(NSError **)error
{
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)[self _searchQuery]);

  if (status == errSecSuccess) {
    _session = nil;
    return YES;
  } else {
    if (error) {
      * error = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain")
                                    code:-1
                                userInfo:@{ NSLocalizedDescriptionKey: @"Could not delete session from keychain" }];
    }
    return NO;
  }
}

- (NSDictionary *)_searchQuery
{
  NSData *encodedKey = [kEXSessionKeychainKey dataUsingEncoding:NSUTF8StringEncoding];
  return @{
           (__bridge id)kSecClass:(__bridge id)kSecClassGenericPassword,
           (__bridge id)kSecAttrService:kEXSessionKeychainService,
           (__bridge id)kSecAttrGeneric:encodedKey,
           (__bridge id)kSecAttrAccount:encodedKey
           };
}

@end
