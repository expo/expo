//
//  SEGAES256Crypto.m
//  Analytics
//
//  Copyright © 2016 Segment. All rights reserved.
//


#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonKeyDerivation.h>
#import "SEGAES256Crypto.h"
#import "SEGUtils.h"

// Implementation courtesy of http://robnapier.net/aes-commoncrypto

static NSString *const kRNCryptManagerErrorDomain = @"com.segment.crypto";

static const CCAlgorithm kAlgorithm = kCCAlgorithmAES;
static const NSUInteger kAlgorithmKeySize = kCCKeySizeAES256;
static const NSUInteger kAlgorithmBlockSize = kCCBlockSizeAES128;
static const NSUInteger kAlgorithmIVSize = kCCBlockSizeAES128;
static const NSUInteger kPBKDFSaltSize = 8;
static const NSUInteger kPBKDFRounds = 10000; // ~80ms on an iPhone 4


@implementation SEGAES256Crypto

- (instancetype)initWithPassword:(NSString *)password salt:(NSData *)salt iv:(NSData *_Nonnull)iv
{
    if (self = [super init]) {
        _password = password;
        _salt = salt;
        _iv = iv;
    }
    return self;
}

- (instancetype)initWithPassword:(NSString *)password
{
    NSData *iv = [SEGAES256Crypto randomDataOfLength:kAlgorithmIVSize];
    NSData *salt = [SEGAES256Crypto randomDataOfLength:kPBKDFSaltSize];
    return [self initWithPassword:password salt:salt iv:iv];
}

- (NSData *)aesKey
{
    return [[self class] AESKeyForPassword:self.password salt:self.salt];
}

- (NSData *)encrypt:(NSData *)data
{
    size_t outLength;
    NSMutableData *cipherData = [NSMutableData dataWithLength:data.length + kAlgorithmBlockSize];

    CCCryptorStatus
        result = CCCrypt(kCCEncrypt,              // operation
                         kAlgorithm,              // Algorithm
                         kCCOptionPKCS7Padding,   // options
                         self.aesKey.bytes,       // key
                         self.aesKey.length,      // keylength
                         self.iv.bytes,           // iv
                         data.bytes,              // dataIn
                         data.length,             // dataInLength,
                         cipherData.mutableBytes, // dataOut
                         cipherData.length,       // dataOutAvailable
                         &outLength);             // dataOutMoved

    if (result == kCCSuccess) {
        cipherData.length = outLength;
    } else {
        NSError *error = [NSError errorWithDomain:kRNCryptManagerErrorDomain
                                             code:result
                                         userInfo:nil];
        SEGLog(@"Unable to encrypt data", error);
        return nil;
    }
    return cipherData;
}

- (NSData *)decrypt:(NSData *)data
{
    size_t outLength;
    NSMutableData *decryptedData = [NSMutableData dataWithLength:data.length + kAlgorithmBlockSize];

    CCCryptorStatus
        result = CCCrypt(kCCDecrypt,                 // operation
                         kAlgorithm,                 // Algorithm
                         kCCOptionPKCS7Padding,      // options
                         self.aesKey.bytes,          // key
                         self.aesKey.length,         // keylength
                         self.iv.bytes,              // iv
                         data.bytes,                 // dataIn
                         data.length,                // dataInLength,
                         decryptedData.mutableBytes, // dataOut
                         decryptedData.length,       // dataOutAvailable
                         &outLength);                // dataOutMoved

    if (result == kCCSuccess) {
        decryptedData.length = outLength;
    } else {
        NSError *error = [NSError errorWithDomain:kRNCryptManagerErrorDomain
                                             code:result
                                         userInfo:nil];
        SEGLog(@"Unable to decrypt data", error);
        return nil;
    }
    return decryptedData;
}

+ (NSData *)randomDataOfLength:(size_t)length
{
    NSMutableData *data = [NSMutableData dataWithLength:length];

    int result = SecRandomCopyBytes(kSecRandomDefault,
                                    length,
                                    data.mutableBytes);
    if (result != kCCSuccess) {
        SEGLog(@"Unable to generate random bytes: %d", result);
    }

    return data;
}

// Replace this with a 10,000 hash calls if you don't have CCKeyDerivationPBKDF
+ (NSData *)AESKeyForPassword:(NSString *)password
                         salt:(NSData *)salt
{
    NSMutableData *derivedKey = [NSMutableData dataWithLength:kAlgorithmKeySize];

    int result = CCKeyDerivationPBKDF(kCCPBKDF2,                                                  // algorithm
                                      password.UTF8String,                                        // password
                                      [password lengthOfBytesUsingEncoding:NSUTF8StringEncoding], // passwordLength
                                      salt.bytes,                                                 // salt
                                      salt.length,                                                // saltLen
                                      kCCPRFHmacAlgSHA1,                                          // PRF
                                      kPBKDFRounds,                                               // rounds
                                      derivedKey.mutableBytes,                                    // derivedKey
                                      derivedKey.length);                                         // derivedKeyLen

    // Do not log password here
    if (result != kCCSuccess) {
        SEGLog(@"Unable to create AES key for password: %d", result);
    }

    return derivedKey;
}

@end
