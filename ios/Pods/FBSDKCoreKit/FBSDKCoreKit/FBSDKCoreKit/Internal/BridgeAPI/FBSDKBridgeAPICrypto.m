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

#import "FBSDKBridgeAPICrypto.h"

#import "FBSDKBridgeAPIProtocol.h"
#import "FBSDKConstants.h"
#import "FBSDKCrypto.h"
#import "FBSDKError.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKSettings.h"
#import "FBSDKUtility.h"

static NSString *const FBSDKBridgeAPICryptoCipherKey = @"cipher";
static NSString *const FBSDKBridgeAPICryptoCipherKeyKey = @"cipher_key";
static NSString *g_cipherKey = nil;

@implementation FBSDKBridgeAPICrypto

#pragma mark - Class Methods

+ (void)addCipherKeyToQueryParameters:(NSMutableDictionary *)queryParameters
{
  [FBSDKInternalUtility dictionary:queryParameters setObject:[self _cipherKey] forKey:FBSDKBridgeAPICryptoCipherKeyKey];
}

+ (NSDictionary *)decryptResponseForRequest:(FBSDKBridgeAPIRequest *)request
                            queryParameters:(NSDictionary *)queryParameters
                                      error:(NSError *__autoreleasing *)errorRef
{
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  NSString *cipher = queryParameters[FBSDKBridgeAPICryptoCipherKey];
  if (!cipher) {
    return queryParameters ?: @{};
  }
  NSString *version = queryParameters[FBSDKBridgeAPIVersionKey];
  NSString *cipherKey = [self _cipherKey];
  if (!version || !cipherKey) {
    if (errorRef != NULL) {
      NSDictionary *userInfo = @{
                                 FBSDKErrorArgumentValueKey: queryParameters,
                                 };
      *errorRef = [NSError fbErrorWithCode:FBSDKErrorEncryption
                                   userInfo:userInfo
                                    message:@"Error decrypting incoming query parameters."
                            underlyingError:nil];
    }
    return nil;
  }
  NSArray *additionalSignedDataArray = @[
                                         [[NSBundle mainBundle] bundleIdentifier],
                                         [FBSDKSettings appID] ?: @"",
                                         @"bridge",
                                         request.methodName ?: @"",
                                         version,
                                         ];
  NSString *additionalSignedDataString = [additionalSignedDataArray componentsJoinedByString:@":"];
  NSData *additionalSignedData = [additionalSignedDataString dataUsingEncoding:NSUTF8StringEncoding];
  FBSDKCrypto *crypto = [[FBSDKCrypto alloc] initWithMasterKey:cipherKey];
  NSData *decryptedData = [crypto decrypt:cipher additionalSignedData:additionalSignedData];
  if (!decryptedData) {
    if (errorRef != NULL) {
      NSDictionary *userInfo = @{
                                 FBSDKErrorArgumentValueKey: @{
                                     @"cipher": cipher,
                                     @"bundleIdentifier": additionalSignedDataArray[0],
                                     @"appID": additionalSignedDataArray[1],
                                     @"host": additionalSignedDataArray[2],
                                     @"methodName": additionalSignedDataArray[3],
                                     @"version": additionalSignedDataArray[4],
                                     },
                                 };
      *errorRef = [NSError fbErrorWithCode:FBSDKErrorEncryption
                                   userInfo:userInfo
                                    message:@"Error decrypting incoming query parameters."
                            underlyingError:nil];
    }
    return nil;
  }
  NSString *decryptedString = [[NSString alloc] initWithData:decryptedData encoding:NSUTF8StringEncoding];
  NSDictionary *decryptedDictionary = [FBSDKUtility dictionaryWithQueryString:decryptedString];
  NSMutableDictionary *decryptedQueryParameters = [[NSMutableDictionary alloc] initWithDictionary:decryptedDictionary];
  decryptedQueryParameters[FBSDKBridgeAPIVersionKey] = version;
  return [decryptedQueryParameters copy];
}

+ (void)reset
{
  [self _resetCipherKey];
}

#pragma mark - Helper Methods

+ (NSString *)_cipherKey
{
  if (g_cipherKey) {
    return g_cipherKey;
  }
  g_cipherKey = [[[NSUserDefaults standardUserDefaults] stringForKey:FBSDKBridgeAPICryptoCipherKeyKey] copy];
  if (g_cipherKey) {
    return g_cipherKey;
  }
  return [self _resetCipherKey];
}

+ (NSString *)_resetCipherKey
{
  g_cipherKey = [[FBSDKCrypto makeMasterKey] copy];
  [[NSUserDefaults standardUserDefaults] setObject:g_cipherKey forKey:FBSDKBridgeAPICryptoCipherKeyKey];
  return g_cipherKey;
}

@end
