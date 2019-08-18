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

#import <Foundation/Foundation.h>

@interface FBSDKCrypto : NSObject

/**
  Generate numOfBytes random data.

 This calls the system-provided function SecRandomCopyBytes, based on /dev/random.
 */
+ (NSData *)randomBytes:(NSUInteger)numOfBytes;

/**
 * Generate numOfBytes random data, base64-encoded.
 * This calls the system-provided function SecRandomCopyBytes, based on /dev/random.
 */
+ (NSString *)randomString:(NSUInteger)numOfBytes;

/**
  Generate a fresh master key using SecRandomCopyBytes, the result is encoded in base64/.
 */
+ (NSString *)makeMasterKey;

/**
  Initialize with a base64-encoded master key.

 This key and the current derivation function will be used to generate the encryption key and the mac key.
 */
- (instancetype)initWithMasterKey:(NSString *)masterKey;

/**
  Initialize with base64-encoded encryption key and mac key.
 */
- (instancetype)initWithEncryptionKey:(NSString *)encryptionKey macKey:(NSString *)macKey;

/**
  Encrypt plainText and return the base64 encoded result.

 MAC computation involves additionalDataToSign.
 */
- (NSString *)encrypt:(NSData *)plainText additionalDataToSign:(NSData *)additionalDataToSign;

/**
  Decrypt base64EncodedCipherText.

 MAC computation involves additionalSignedData.
 */
- (NSData *)decrypt:(NSString *)base64EncodedCipherText additionalSignedData:(NSData *)additionalSignedData;

@end
