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

#import "TargetConditionals.h"

#if TARGET_OS_TV

 #import "FBSDKDeviceUtilities.h"

@implementation FBSDKDeviceUtilities

+ (UIImage *)buildQRCodeWithAuthorizationCode:(NSString *)authorizationCode
{
  NSString *authorizationUri = @"https://facebook.com/device";
  if ([authorizationCode length] > 0) {
    authorizationUri = [NSString stringWithFormat:@"https://facebook.com/device?user_code=%@&qr=1", authorizationCode];
  }
  NSData *qrCodeData = [authorizationUri dataUsingEncoding:NSISOLatin1StringEncoding];

  CIFilter *qrCodeFilter = [CIFilter filterWithName:@"CIQRCodeGenerator"];
  [qrCodeFilter setValue:qrCodeData forKey:@"inputMessage"];
  [qrCodeFilter setValue:@"M" forKey:@"inputCorrectionLevel"];

  CIImage *qrCodeImage = qrCodeFilter.outputImage;
  CGRect qrImageSize = CGRectIntegral(qrCodeImage.extent);
  CGSize qrOutputSize = CGSizeMake(200, 200);

  CIImage *resizedImage =
  [qrCodeImage imageByApplyingTransform:CGAffineTransformMakeScale(
    qrOutputSize.width / CGRectGetWidth(qrImageSize),
    qrOutputSize.height / CGRectGetHeight(qrImageSize)
   )];

  return [UIImage imageWithCIImage:resizedImage];
}

@end

#endif
