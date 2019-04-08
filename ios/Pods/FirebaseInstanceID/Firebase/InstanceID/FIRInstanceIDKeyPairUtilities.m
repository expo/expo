/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "FIRInstanceIDKeyPairUtilities.h"

#import <CommonCrypto/CommonDigest.h>

#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDKeyPair.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDStringEncoding.h"

NSString *FIRInstanceIDWebSafeBase64(NSData *data) {
  // Websafe encoding with no padding.
  FIRInstanceIDStringEncoding *encoding =
      [FIRInstanceIDStringEncoding rfc4648Base64WebsafeStringEncoding];
  [encoding setDoPad:NO];
  return [encoding encode:data];
}

NSData *FIRInstanceIDSHA1(NSData *data) {
  unsigned int outputLength = CC_SHA1_DIGEST_LENGTH;
  unsigned char output[outputLength];
  unsigned int length = (unsigned int)[data length];

  CC_SHA1(data.bytes, length, output);
  return [NSMutableData dataWithBytes:output length:outputLength];
}

NSDictionary *FIRInstanceIDKeyPairQuery(NSString *tag, BOOL addReturnAttr, BOOL returnData) {
  NSMutableDictionary *queryKey = [NSMutableDictionary dictionary];
  NSData *tagData = [tag dataUsingEncoding:NSUTF8StringEncoding];

  queryKey[(__bridge id)kSecClass] = (__bridge id)kSecClassKey;
  queryKey[(__bridge id)kSecAttrApplicationTag] = tagData;
  queryKey[(__bridge id)kSecAttrKeyType] = (__bridge id)kSecAttrKeyTypeRSA;
  if (addReturnAttr) {
    if (returnData) {
      queryKey[(__bridge id)kSecReturnData] = @(YES);
    } else {
      queryKey[(__bridge id)kSecReturnRef] = @(YES);
    }
  }
  return queryKey;
}

NSString *FIRInstanceIDAppIdentity(FIRInstanceIDKeyPair *keyPair) {
  // An Instance-ID is a 64 bit (8 byte) integer with a fixed 4-bit header of 0111 (=^ 0x7).
  // The variable 60 bits are obtained by truncating the SHA1 of the app-instance's public key.
  SecKeyRef publicKeyRef = [keyPair publicKey];
  if (!publicKeyRef) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPair002,
                             @"Unable to create a valid asymmetric crypto key");
    return nil;
  }
  NSData *publicKeyData = keyPair.publicKeyData;
  NSData *publicKeySHA1 = FIRInstanceIDSHA1(publicKeyData);

  const uint8_t *bytes = publicKeySHA1.bytes;
  NSMutableData *identityData = [NSMutableData dataWithData:publicKeySHA1];

  uint8_t b0 = bytes[0];
  // Take the first byte and make the initial four 7 by initially making the initial 4 bits 0
  // and then adding 0x70 to it.
  b0 = 0x70 + (0xF & b0);
  // failsafe should give you back b0 itself
  b0 = (b0 & 0xFF);
  [identityData replaceBytesInRange:NSMakeRange(0, 1) withBytes:&b0];
  NSData *data = [identityData subdataWithRange:NSMakeRange(0, 8 * sizeof(Byte))];
  return FIRInstanceIDWebSafeBase64(data);
}
