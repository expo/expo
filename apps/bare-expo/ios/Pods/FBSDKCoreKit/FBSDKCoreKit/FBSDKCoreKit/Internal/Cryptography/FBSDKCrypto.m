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

#import "FBSDKCrypto.h"

#import "FBSDKBase64.h"
#import "FBSDKDynamicFrameworkLoader.h"

static inline void FBSDKCryptoBlankData(NSData *data)
{
  if (!data) {
    return;
  }
  bzero((void *) [data bytes], [data length]);
}

@implementation FBSDKCrypto

+ (NSData *)randomBytes:(NSUInteger)numOfBytes
{
  uint8_t *buffer = malloc(numOfBytes);
  int result = fbsdkdfl_SecRandomCopyBytes([FBSDKDynamicFrameworkLoader loadkSecRandomDefault], numOfBytes, buffer);
  if (result != 0) {
    free(buffer);
    return nil;
  }
  return [NSData dataWithBytesNoCopy:buffer length:numOfBytes];
}

+ (NSString *)randomString:(NSUInteger)numOfBytes
{
  NSData *randomStringData = [FBSDKCrypto randomBytes:numOfBytes];
  NSString *randomString = [FBSDKBase64 encodeData:randomStringData];
  FBSDKCryptoBlankData(randomStringData);
  return randomString;
}

@end
