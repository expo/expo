// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXSession.h"
#import "EXUnversioned.h"

NSString * const kEXSessionKeychainKey = @"host.exp.exponent.session";
NSString * const kEXSessionKeychainService = @"app";

@interface EXSession ()

@property (nonatomic, strong) NSDictionary *session;

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

- (NSDictionary * _Nullable)session
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
    NSError *jsonError;
    id session = [NSJSONSerialization JSONObjectWithData:result
                                                     options:kNilOptions
                                                       error:&jsonError];
    if (!jsonError && [session isKindOfClass:[NSDictionary class]]) {
      return (NSDictionary *)session;
    }
  }
  return nil;
}

- (NSString * _Nullable)sessionSecret
{
  NSDictionary *session = [self session];
  if (!session) {
    return nil;
  }
  
  id sessionSecret = session[@"sessionSecret"];
  if (sessionSecret && [sessionSecret isKindOfClass:[NSString class]]) {
    return (NSString *)sessionSecret;
  }
  return nil;
}

- (BOOL)saveSessionToKeychain:(NSDictionary *)session error:(NSError **)error
{
  NSError *jsonError;
  NSData *encodedData = [NSJSONSerialization dataWithJSONObject:session
                                                        options:kNilOptions
                                                          error:&jsonError];
  if (jsonError) {
    if (error) {
      *error = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain")
                                    code:-1
                                userInfo:@{
                                           NSLocalizedDescriptionKey: @"Could not serialize JSON to save session to keychain",
                                           NSUnderlyingErrorKey: jsonError
                                           }];
    }
    return NO;
  }

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
      *error = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain")
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
      *error = [NSError errorWithDomain:EX_UNVERSIONED(@"EXKernelErrorDomain")
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
