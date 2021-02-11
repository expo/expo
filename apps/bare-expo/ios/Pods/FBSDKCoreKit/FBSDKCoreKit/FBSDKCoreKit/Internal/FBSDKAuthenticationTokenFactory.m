// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKAuthenticationTokenFactory.h"

#if SWIFT_PACKAGE
@import FBSDKCoreKit;
#else
 #import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

#ifdef FBSDKCOCOAPODS
 #import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
 #import "FBSDKCoreKit+Internal.h"
#endif

#import <Security/Security.h>

#import <CommonCrypto/CommonCrypto.h>

#import "FBSDKAuthenticationTokenClaims.h"
#import "FBSDKSessionProviding.h"

static NSString *const FBSDKBeginCertificate = @"-----BEGIN CERTIFICATE-----";
static NSString *const FBSDKEndCertificate = @"-----END CERTIFICATE-----";

typedef void (^FBSDKPublicCertCompletionBlock)(SecCertificateRef cert);
typedef void (^FBSDKPublicKeyCompletionBlock)(SecKeyRef key);
typedef void (^FBSDKVerifySignatureCompletionBlock)(BOOL success);

@interface FBSDKAuthenticationToken (FactoryInitializer)

- (instancetype)initWithTokenString:(NSString *)tokenString
                              nonce:(NSString *)nonce
                             claims:(nullable FBSDKAuthenticationTokenClaims *)claims
                        graphDomain:(NSString *)graphDomain;

@end

@interface FBSDKAuthenticationTokenFactory () <NSURLSessionDelegate>

@end

@implementation FBSDKAuthenticationTokenFactory
{
  NSString *_cert;
  id<FBSDKSessionProviding> _sessionProvider;
}

- (instancetype)init
{
  self = [self initWithSessionProvider:[NSURLSession sessionWithConfiguration:NSURLSessionConfiguration.defaultSessionConfiguration delegate:self delegateQueue:nil]];
  return self;
}

- (instancetype)initWithSessionProvider:(id<FBSDKSessionProviding>)sessionProvider
{
  if ((self = [super init])) {
    _sessionProvider = sessionProvider;
  }
  return self;
}

- (void)createTokenFromTokenString:(NSString *_Nonnull)tokenString
                             nonce:(NSString *_Nonnull)nonce
                        completion:(FBSDKAuthenticationTokenBlock)completion
{
  [self createTokenFromTokenString:tokenString
                             nonce:nonce
                       graphDomain:@"facebook"
                        completion:completion];
}

- (void)createTokenFromTokenString:(NSString *_Nonnull)tokenString
                             nonce:(NSString *_Nonnull)nonce
                       graphDomain:(NSString *)graphDomain
                        completion:(FBSDKAuthenticationTokenBlock)completion
{
  if (tokenString.length == 0 || nonce.length == 0) {
    completion(nil);
    return;
  }

  NSString *signature;
  FBSDKAuthenticationTokenClaims *claims;
  FBSDKAuthenticationTokenHeader *header;

  NSArray *segments = [tokenString componentsSeparatedByString:@"."];
  if (segments.count != 3) {
    completion(nil);
    return;
  }

  NSString *encodedHeader = [FBSDKTypeUtility array:segments objectAtIndex:0];
  NSString *encodedClaims = [FBSDKTypeUtility array:segments objectAtIndex:1];
  signature = [FBSDKTypeUtility array:segments objectAtIndex:2];

  claims = [FBSDKAuthenticationTokenClaims validatedClaimsWithEncodedString:encodedClaims nonce:nonce];
  header = [FBSDKAuthenticationTokenHeader validatedHeaderWithEncodedString:encodedHeader];

  if (!claims || !header) {
    completion(nil);
    return;
  }

  [self verifySignature:signature
                 header:encodedHeader
                 claims:encodedClaims
         certificateKey:header.kid
             completion:^(BOOL success) {
               if (success) {
                 FBSDKAuthenticationToken *token = [[FBSDKAuthenticationToken alloc] initWithTokenString:tokenString
                                                                                                   nonce:nonce
                                                                                                  claims:claims
                                                                                             graphDomain:graphDomain];
                 completion(token);
               } else {
                 completion(nil);
               }
             }];
}

- (void)verifySignature:(NSString *)signature
                 header:(NSString *)header
                 claims:(NSString *)claims
         certificateKey:(NSString *)certificateKey
             completion:(FBSDKVerifySignatureCompletionBlock)completion
{
#if DEBUG
  // skip signature checking for tests
  if (_skipSignatureVerification && completion) {
    completion(YES);
  }
#endif

  NSData *signatureData = [FBSDKBase64 decodeAsData:[FBSDKBase64 base64FromBase64Url:signature]];
  NSString *signedString = [NSString stringWithFormat:@"%@.%@", header, claims];
  NSData *signedData = [signedString dataUsingEncoding:NSASCIIStringEncoding];
  [self getPublicKeyWithCertificateKey:certificateKey
                            completion:^(SecKeyRef key) {
                              if (key && signatureData && signedData) {
                                size_t signatureBytesSize = SecKeyGetBlockSize(key);
                                const void *signatureBytes = signatureData.bytes;

                                size_t digestSize = CC_SHA256_DIGEST_LENGTH;
                                uint8_t digestBytes[digestSize];
                                CC_SHA256(signedData.bytes, (CC_LONG)signedData.length, digestBytes);

                                OSStatus status = SecKeyRawVerify(
                                  key,
                                  kSecPaddingPKCS1SHA256,
                                  digestBytes,
                                  digestSize,
                                  signatureBytes,
                                  signatureBytesSize
                                );
                                fb_dispatch_on_main_thread(^{
                                  completion(status == errSecSuccess);
                                });
                              } else {
                                fb_dispatch_on_main_thread(^{
                                  completion(NO);
                                });
                              }
                            }];
}

- (void)getPublicKeyWithCertificateKey:(NSString *)certificateKey
                            completion:(FBSDKPublicKeyCompletionBlock)completion
{
  [self getCertificateWithKey:certificateKey
                   completion:^(SecCertificateRef cert) {
                     SecKeyRef publicKey = nil;

                     if (cert) {
                       SecPolicyRef policy = SecPolicyCreateBasicX509();
                       OSStatus status = -1;
                       SecTrustRef trust;

                       status = SecTrustCreateWithCertificates(cert, policy, &trust);

                       if (status == errSecSuccess && trust) {
                         publicKey = SecTrustCopyPublicKey(trust);
                       }

                       CFRelease(policy);
                       CFRelease(cert);
                     }

                     completion(publicKey);
                   }];
}

- (void)getCertificateWithKey:(NSString *)certificateKey
                   completion:(FBSDKPublicCertCompletionBlock)completion
{
  NSURLRequest *request = [NSURLRequest requestWithURL:[self _certificateEndpoint]];
  [[_sessionProvider dataTaskWithRequest:request
                       completionHandler:^(NSData *_Nullable data, NSURLResponse *_Nullable response, NSError *_Nullable error) {
                         if (error || !data) {
                           return completion(nil);
                         }

                         if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
                           NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
                           if (httpResponse.statusCode != 200) {
                             return completion(nil);
                           }
                         }

                         SecCertificateRef result = NULL;
                         NSDictionary *certs = [FBSDKTypeUtility JSONObjectWithData:data options:0 error:nil];
                         NSString *certString = [FBSDKTypeUtility dictionary:certs objectForKey:certificateKey ofType:NSString.class];
                         if (!certString) {
                           return completion(nil);
                         }
                         certString = [certString stringByReplacingOccurrencesOfString:FBSDKBeginCertificate withString:@""];
                         certString = [certString stringByReplacingOccurrencesOfString:FBSDKEndCertificate withString:@""];
                         certString = [certString stringByReplacingOccurrencesOfString:@"\n" withString:@""];

                         NSData *secCertificateData = [[NSData alloc] initWithBase64EncodedString:certString options:0];
                         result = SecCertificateCreateWithData(kCFAllocatorDefault, (__bridge CFDataRef)secCertificateData);
                         completion(result);
                       }] resume];
}

- (NSURL *)_certificateEndpoint
{
  NSError *error;
  NSURL *url = [FBSDKInternalUtility unversionedFacebookURLWithHostPrefix:@"m"
                                                                     path:@"/.well-known/oauth/openid/certs/"
                                                          queryParameters:@{}
                                                                    error:&error];

  return url;
}

#pragma mark - Test methods

#if DEBUG

static BOOL _skipSignatureVerification;

+ (void)setSkipSignatureVerification:(BOOL)value
{
  _skipSignatureVerification = value;
}

+ (instancetype)emptyInstance
{
  return [super new];
}

- (void)setCertificate:(NSString *)certificate
{
  _cert = certificate;
}

#endif

@end
