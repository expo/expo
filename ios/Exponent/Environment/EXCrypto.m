// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCrypto.h"

#import <CommonCrypto/CommonDigest.h>

#import "EXCachedResource.h"

NS_ASSUME_NONNULL_BEGIN

static NSString* kPublicKeyTag = @"exp.host.publickey";

@implementation EXCrypto

+ (instancetype)sharedInstance
{
  static EXCrypto *theCrypto;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theCrypto) {
      theCrypto = [EXCrypto new];
    }
  });
  return theCrypto;
}

- (void)verifySignatureWithPublicKeyUrl:(NSURL *)publicKeyUrl
                                   data:(NSString *)data
                              signature:(NSString *)signature
                           successBlock:(EXVerifySignatureSuccessBlock)successBlock
                             errorBlock:(EXVerifySignatureErrorBlock)errorBlock
{
  [self fetchAndVerifySignatureWithPublicKeyUrl:publicKeyUrl
                                           data:data
                                      signature:signature
                                       useCache:YES
                                   successBlock:successBlock
                                     errorBlock:errorBlock];
}

- (void)fetchAndVerifySignatureWithPublicKeyUrl:(NSURL *)publicKeyUrl
                                           data:(NSString *)data
                                      signature:(NSString *)signature
                                       useCache:(BOOL)useCache
                                   successBlock:(EXVerifySignatureSuccessBlock)successBlock
                                     errorBlock:(EXVerifySignatureErrorBlock)errorBlock
{
  EXCachedResource *publicKeyResource = [[EXCachedResource alloc] initWithResourceName:@"manifestPublicKey"
                                                                          resourceType:@"pem"
                                                                             remoteUrl:publicKeyUrl
                                                                             cachePath:nil];
  EXCachedResourceBehavior cacheBehavior = useCache ? kEXCachedResourceUseCacheImmediately : kEXCachedResourceNoCache;
  [publicKeyResource loadResourceWithBehavior:cacheBehavior successBlock:^(NSData *publicKeyData) {
    SecKeyRef publicKey = [self keyRefFromPEMData:publicKeyData];

    NSData *signatureData = [[NSData alloc] initWithBase64EncodedString:signature options:0];
    NSData *signedData = [data dataUsingEncoding:NSUTF8StringEncoding];

    BOOL isValid = [self verifyRSASHA256SignedData:signedData signatureData:signatureData publicKey:publicKey];
    if (!isValid && useCache) {
      [self fetchAndVerifySignatureWithPublicKeyUrl:publicKeyUrl
                                               data:data
                                          signature:signature
                                           useCache:NO
                                       successBlock:successBlock
                                         errorBlock:errorBlock];
    } else {
      successBlock(isValid);
    }
  } errorBlock:^(NSError *error) {
    errorBlock(error);
  }];
}

- (_Nullable SecKeyRef)keyRefFromPEMData:(NSData *)pemData
{
  NSString *pemString = [[NSString alloc] initWithData:pemData encoding:NSUTF8StringEncoding];

  NSString *key = [NSString string];
  NSArray<NSString *> *keyLines = [pemString componentsSeparatedByString:@"\n"];
  BOOL foundKey = NO;

  for (NSString *line in keyLines) {
    if ([line isEqualToString:@"-----BEGIN PUBLIC KEY-----"]) {
      foundKey = YES;
    } else if ([line isEqualToString:@"-----END PUBLIC KEY-----"]) {
      foundKey = NO;
    } else if (foundKey) {
      key = [key stringByAppendingString:line];
    }
  }

  if (key.length == 0) {
    return nil;
  }

  NSData *keyData = [[NSData alloc] initWithBase64EncodedString:key options:0];
  if (keyData == nil) {
    return nil;
  }

  NSData *tag = [NSData dataWithBytes:[kPublicKeyTag UTF8String] length:[kPublicKeyTag length]];

  // Delete any old lingering key with the same tag.
  NSMutableDictionary *publicKey = [[NSMutableDictionary alloc] init];
  [publicKey setObject:(id) kSecClassKey forKey:(id)kSecClass];
  [publicKey setObject:(id) kSecAttrKeyTypeRSA forKey:(id)kSecAttrKeyType];
  [publicKey setObject:tag forKey:(id)kSecAttrApplicationTag];
  SecItemDelete((CFDictionaryRef)publicKey);

  CFTypeRef persistKey = nil;

  // Add key to system keychain.
  [publicKey setObject:keyData forKey:(id)kSecValueData];
  [publicKey setObject:(id) kSecAttrKeyClassPublic forKey:(id)kSecAttrKeyClass];
  [publicKey setObject:[NSNumber numberWithBool:YES] forKey:(id)kSecReturnPersistentRef];

  OSStatus secStatus = SecItemAdd((CFDictionaryRef)publicKey, &persistKey);
  if (persistKey != nil) {
    CFRelease(persistKey);
  }

  if (secStatus != noErr && secStatus != errSecDuplicateItem) {
    return nil;
  }

  // Fetch the SecKeyRef version of the key.
  SecKeyRef keyRef = nil;

  [publicKey removeObjectForKey:(id)kSecValueData];
  [publicKey removeObjectForKey:(id)kSecReturnPersistentRef];
  [publicKey setObject:[NSNumber numberWithBool:YES] forKey:(id)kSecReturnRef];
  [publicKey setObject:(id)kSecAttrKeyTypeRSA forKey:(id)kSecAttrKeyType];
  secStatus = SecItemCopyMatching((CFDictionaryRef)publicKey, (CFTypeRef *)&keyRef);
  
  return keyRef;
}

- (BOOL)verifyRSASHA256SignedData:(NSData *)signedData signatureData:(NSData *)signatureData publicKey:(_Nullable SecKeyRef)publicKey
{
  if (!publicKey) {
    return NO;
  }

  uint8_t hashBytes[CC_SHA256_DIGEST_LENGTH];
  if (!CC_SHA256([signedData bytes], (CC_LONG)[signedData length], hashBytes)) {
    return NO;
  }

  OSStatus status = SecKeyRawVerify(publicKey,
                                    kSecPaddingPKCS1SHA256,
                                    hashBytes,
                                    CC_SHA256_DIGEST_LENGTH,
                                    [signatureData bytes],
                                    [signatureData length]);

  return status == errSecSuccess;
}

@end

NS_ASSUME_NONNULL_END
