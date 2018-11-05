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

#import "FBSDKErrorRecoveryAttempter.h"

#import "_FBSDKTemporaryErrorRecoveryAttempter.h"
#import "FBSDKErrorRecoveryConfiguration.h"

@implementation FBSDKErrorRecoveryAttempter

+ (instancetype)recoveryAttempterFromConfiguration:(FBSDKErrorRecoveryConfiguration *)configuration
{
  if (configuration.errorCategory == FBSDKGraphRequestErrorCategoryTransient) {
    return [[_FBSDKTemporaryErrorRecoveryAttempter alloc] init];
  } else if (configuration.errorCategory == FBSDKGraphRequestErrorCategoryOther) {
    return nil;
  }
  if ([configuration.recoveryActionName isEqualToString:@"login"]) {
    Class loginRecoveryAttmpterClass = NSClassFromString(@"_FBSDKLoginRecoveryAttempter");
    if (loginRecoveryAttmpterClass) {
      return [[loginRecoveryAttmpterClass alloc] init];
    }
  }
  return nil;
}

- (void)attemptRecoveryFromError:(NSError *)error optionIndex:(NSUInteger)recoveryOptionIndex delegate:(id)delegate didRecoverSelector:(SEL)didRecoverSelector contextInfo:(void *)contextInfo
{
  // should be implemented by subclasses.
}
@end

@implementation FBSDKErrorRecoveryAttempter(Protected)

- (void)completeRecovery:(BOOL)didRecover delegate:(id)delegate didRecoverSelector:(SEL)didRecoverSelector contextInfo:(void *)contextInfo
{
  void (*callback)(id, SEL, BOOL, void *) = (void *)[delegate methodForSelector:didRecoverSelector];
  (*callback)(delegate, didRecoverSelector, didRecover, contextInfo);
}

@end
