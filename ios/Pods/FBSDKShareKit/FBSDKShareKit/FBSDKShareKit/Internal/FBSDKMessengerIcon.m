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

#import "FBSDKMessengerIcon.h"

@implementation FBSDKMessengerIcon

- (CGPathRef)pathWithSize:(CGSize)size
{
  CGAffineTransform transformValue = CGAffineTransformMakeScale(size.width / 61.0, size.height / 61.0);
  const CGAffineTransform *transform = &transformValue;
  CGMutablePathRef path = CGPathCreateMutable();
  CGPathMoveToPoint(path, transform, 30.001, 0.962);
  CGPathAddCurveToPoint(path, transform, 13.439, 0.962, 0.014, 13.462, 0.014, 28.882);
  CGPathAddCurveToPoint(path, transform, 0.014, 37.165, 3.892, 44.516, 10.046, 49.549);
  CGPathAddLineToPoint(path, transform, 10.046, 61.176);
  CGPathAddLineToPoint(path, transform, 19.351, 54.722);
  CGPathAddCurveToPoint(path, transform, 22.662, 55.870, 26.250, 56.502, 30.002, 56.502);
  CGPathAddCurveToPoint(path, transform, 46.565, 56.502, 59.990, 44.301, 59.990, 28.882);
  CGPathAddCurveToPoint(path, transform, 59.989, 13.462, 46.564, 0.962, 30.001, 0.962);
  CGPathCloseSubpath(path);
  CGPathMoveToPoint(path, transform, 33.159, 37.473);
  CGPathAddLineToPoint(path, transform, 25.403, 29.484);
  CGPathAddLineToPoint(path, transform, 10.467, 37.674);
  CGPathAddLineToPoint(path, transform, 26.843, 20.445);
  CGPathAddLineToPoint(path, transform, 34.599, 28.433);
  CGPathAddLineToPoint(path, transform, 49.535, 20.244);
  CGPathAddLineToPoint(path, transform, 33.159, 37.473);
  CGPathCloseSubpath(path);
  CGPathRef result = CGPathCreateCopy(path);
  CGPathRelease(path);
  return CFAutorelease(result);
}

@end
