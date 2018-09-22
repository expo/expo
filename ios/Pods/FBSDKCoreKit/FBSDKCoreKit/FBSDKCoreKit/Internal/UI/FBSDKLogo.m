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

#import "FBSDKLogo.h"

@implementation FBSDKLogo

- (CGPathRef)pathWithSize:(CGSize)size
{
  CGAffineTransform transformValue = CGAffineTransformMakeScale(size.width / 136.0, size.height / 136.0);
  const CGAffineTransform *transform = &transformValue;
  CGMutablePathRef path = CGPathCreateMutable();
  CGPathMoveToPoint(path, transform, 127.856, 0.676);
  CGPathAddLineToPoint(path, transform, 7.469, 0.676);
  CGPathAddCurveToPoint(path, transform, 3.344, 0.676, 0.0, 4.02, 0.0, 8.145);
  CGPathAddLineToPoint(path, transform, 0.0, 128.531);
  CGPathAddCurveToPoint(path, transform, 0.0, 132.656, 3.344, 136.0, 7.469, 136.0);
  CGPathAddLineToPoint(path, transform, 72.282, 136.0);
  CGPathAddLineToPoint(path, transform, 72.282, 83.596);
  CGPathAddLineToPoint(path, transform, 54.646, 83.596);
  CGPathAddLineToPoint(path, transform, 54.646, 63.173);
  CGPathAddLineToPoint(path, transform, 72.282, 63.173);
  CGPathAddLineToPoint(path, transform, 72.282, 48.112);
  CGPathAddCurveToPoint(path, transform, 72.282, 30.633, 82.957, 21.116, 98.549, 21.116);
  CGPathAddCurveToPoint(path, transform, 106.018, 21.116, 112.438, 21.671, 114.309, 21.92);
  CGPathAddLineToPoint(path, transform, 114.309, 40.187);
  CGPathAddLineToPoint(path, transform, 103.495, 40.191);
  CGPathAddCurveToPoint(path, transform, 95.014, 40.191, 93.372, 44.221, 93.372, 50.133);
  CGPathAddLineToPoint(path, transform, 93.372, 63.173);
  CGPathAddLineToPoint(path, transform, 113.596, 63.173);
  CGPathAddLineToPoint(path, transform, 110.963, 83.596);
  CGPathAddLineToPoint(path, transform, 93.372, 83.596);
  CGPathAddLineToPoint(path, transform, 93.372, 136.0);
  CGPathAddLineToPoint(path, transform, 127.856, 136.0);
  CGPathAddCurveToPoint(path, transform, 131.981, 136.0, 135.325, 132.656, 135.325, 128.531);
  CGPathAddLineToPoint(path, transform, 135.325, 8.145);
  CGPathAddCurveToPoint(path, transform, 135.325, 4.02, 131.981, 0.676, 127.856, 0.676);
  CGPathCloseSubpath(path);
  CGPathRef result = CGPathCreateCopy(path);
  CGPathRelease(path);
  return CFAutorelease(result);
}

@end
