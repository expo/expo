// Copyright 2019-present 650 Industries. All rights reserved.

#import <CommonCrypto/CommonDigest.h>
#import <EXUpdates/EXUpdatesCrypto.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesCryptoPublicKeyUrl = @"https://exp.host/--/manifest-public-key";
static NSString * const EXUpdatesCryptoPublicKeyTag = @"exp.host.publickey";
static NSString * const EXUpdatesCryptoPublicKeyFilename = @"manifestPublicKey.pem";

@implementation EXUpdatesCrypto

+ (void)verifySignatureWithData:(NSString *)data
                      signature:(NSString *)signature
                         config:(EXUpdatesConfig *)config
                   successBlock:(EXUpdatesVerifySignatureSuccessBlock)successBlock
                     errorBlock:(EXUpdatesVerifySignatureErrorBlock)errorBlock
{
  if (!data || !signature) {
    errorBlock([NSError errorWithDomain:@"EXUpdatesCrypto" code:1001 userInfo:@{ NSLocalizedDescriptionKey: @"Cannot verify the manifest because it is empty or has no signature." }]);
    return;
  }

  NSURLSessionConfiguration *configuration = NSURLSessionConfiguration.defaultSessionConfiguration;
  configuration.requestCachePolicy = NSURLRequestReturnCacheDataDontLoad;

  void (^fetchRemotelyBlock)(void) = ^{
    [[self class] fetchAndVerifySignatureWithData:data signature:signature config:config successBlock:successBlock errorBlock:errorBlock];
  };

  EXUpdatesFileDownloader *fileDownloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config URLSessionConfiguration:configuration];
  [fileDownloader downloadDataFromURL:[NSURL URLWithString:EXUpdatesCryptoPublicKeyUrl]
                         extraHeaders:@{}
                         successBlock:^(NSData *publicKeyData, NSURLResponse *response) {
                                        [[self class] verifyWithPublicKey:publicKeyData signature:signature signedString:data callback:^(BOOL isValid) {
                                          if (isValid) {
                                            successBlock(isValid);
                                          } else {
                                            fetchRemotelyBlock();
                                          }
                                        }];
                                      }
                           errorBlock:^(NSError *error) {
                                        fetchRemotelyBlock();
                                      }
   ];
}

+ (void)fetchAndVerifySignatureWithData:(NSString *)data
                              signature:(NSString *)signature
                                 config:(EXUpdatesConfig *)config
                           successBlock:(EXUpdatesVerifySignatureSuccessBlock)successBlock
                             errorBlock:(EXUpdatesVerifySignatureErrorBlock)errorBlock
{
  NSURLSessionConfiguration *configuration = NSURLSessionConfiguration.defaultSessionConfiguration;
  configuration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;

  EXUpdatesFileDownloader *fileDownloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config URLSessionConfiguration:configuration];
  [fileDownloader downloadDataFromURL:[NSURL URLWithString:EXUpdatesCryptoPublicKeyUrl]
                         extraHeaders:@{}
                         successBlock:^(NSData *publicKeyData, NSURLResponse *response) {
                                        [[self class] verifyWithPublicKey:publicKeyData signature:signature signedString:data callback:successBlock];
                                      }
                           errorBlock:^(NSError *error) {
                                        errorBlock(error);
                                      }
  ];
}

+ (void)verifyWithPublicKey:(NSData *)publicKeyData
                  signature:(NSString *)signature
               signedString:(NSString *)signedString
                   callback:(EXUpdatesVerifySignatureSuccessBlock)callback
{
  if (!publicKeyData) {
    callback(NO);
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      SecKeyRef publicKey = [self keyRefFromPEMData:publicKeyData];

      NSData *signatureData = [[NSData alloc] initWithBase64EncodedString:signature options:0];
      NSData *signedData = [signedString dataUsingEncoding:NSUTF8StringEncoding];

      BOOL isValid = NO;
      if (publicKey) {
        isValid = [self verifyRSASHA256SignedData:signedData signatureData:signatureData publicKey:publicKey];
        CFRelease(publicKey);
      }
      callback(isValid);
    });
  }
}

/**
 *  Returns a CFRef to a SecKey given the raw pem data.
 *  The CFRef should be CFReleased when you're finished.
 *
 *  Here is the Apple doc for this black hole:
 *  https://developer.apple.com/library/prerelease/content/documentation/Security/Conceptual/CertKeyTrustProgGuide/iPhone_Tasks/iPhone_Tasks.html#//apple_ref/doc/uid/TP40001358-CH208-SW13
 */
+ (nullable SecKeyRef)keyRefFromPEMData:(NSData *)pemData
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

  NSData *tag = [NSData dataWithBytes:[EXUpdatesCryptoPublicKeyTag UTF8String] length:[EXUpdatesCryptoPublicKeyTag length]];

  // Delete any old lingering key with the same tag.
  NSDictionary *deleteParams = @{
                                 (__bridge id)kSecClass: (__bridge id)kSecClassKey,
                                 (__bridge id)kSecAttrKeyType: (__bridge id)kSecAttrKeyTypeRSA,
                                 (__bridge id)kSecAttrApplicationTag: tag,
                                 };
  OSStatus secStatus = SecItemDelete((CFDictionaryRef)deleteParams);

  SecKeyRef savedKeyRef = nil;

  // Add key to system keychain.
  NSDictionary *saveParams = @{
                             (__bridge id)kSecClass: (__bridge id) kSecClassKey,
                             (__bridge id)kSecAttrKeyType: (__bridge id) kSecAttrKeyTypeRSA,
                             (__bridge id)kSecAttrApplicationTag: tag,
                             (__bridge id)kSecAttrKeyClass: (__bridge id) kSecAttrKeyClassPublic,
                             (__bridge id)kSecReturnPersistentRef: (__bridge id)kCFBooleanTrue,
                             (__bridge id)kSecValueData: keyData,
                             (__bridge id)kSecAttrKeySizeInBits: [NSNumber numberWithUnsignedInteger:keyData.length],
                             (__bridge id)kSecAttrEffectiveKeySize: [NSNumber numberWithUnsignedInteger:keyData.length],
                             (__bridge id)kSecAttrCanDerive: (__bridge id) kCFBooleanFalse,
                             (__bridge id)kSecAttrCanEncrypt: (__bridge id) kCFBooleanTrue,
                             (__bridge id)kSecAttrCanDecrypt: (__bridge id) kCFBooleanFalse,
                             (__bridge id)kSecAttrCanVerify: (__bridge id) kCFBooleanTrue,
                             (__bridge id)kSecAttrCanSign: (__bridge id) kCFBooleanFalse,
                             (__bridge id)kSecAttrCanWrap: (__bridge id) kCFBooleanTrue,
                             (__bridge id)kSecAttrCanUnwrap: (__bridge id) kCFBooleanFalse,
                             };

  secStatus = SecItemAdd((CFDictionaryRef)saveParams, (CFTypeRef *)&savedKeyRef);

  if (savedKeyRef != nil) {
    CFRelease(savedKeyRef);
  }

  if (secStatus != noErr && secStatus != errSecDuplicateItem) {
    return nil;
  }

  // Fetch the SecKeyRef version of the key.
  // note that kSecAttrKeyClass: kSecAttrKeyClassPublic doesn't seem to be required here.
  // also: this doesn't work on iOS < 10.0
  SecKeyRef keyRef = nil;
  NSDictionary *queryParams = @{
                              (__bridge id)kSecClass: (__bridge id) kSecClassKey,
                              (__bridge id)kSecAttrKeyType: (__bridge id) kSecAttrKeyTypeRSA,
                              (__bridge id)kSecAttrApplicationTag: tag,
                              (__bridge id)kSecReturnRef: (__bridge id) kCFBooleanTrue,
                              };
  secStatus = SecItemCopyMatching((CFDictionaryRef)queryParams, (CFTypeRef *)&keyRef);
  
  if (secStatus != noErr) {
    return nil;
  }
  
  return keyRef;
}

+ (BOOL)verifyRSASHA256SignedData:(NSData *)signedData signatureData:(NSData *)signatureData publicKey:(nullable SecKeyRef)publicKey
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
