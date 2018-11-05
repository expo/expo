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

#import "FBSDKCheckmarkIcon.h"

@implementation FBSDKCheckmarkIcon

- (CGPathRef)pathWithSize:(CGSize)size
{
  CGAffineTransform transformValue = CGAffineTransformMakeScale(size.width / 100.0, size.height / 100.0);
  CGAffineTransform *transform = &transformValue;
  CGMutablePathRef path = CGPathCreateMutable();
  CGPathMoveToPoint(path, transform, 0.0, 50.0);
  const CGPoint points[] = {
    CGPointMake(12.0, 38.0),
    CGPointMake(37.0, 63.0),
    CGPointMake(87.0, 13.0),
    CGPointMake(99.0, 25.0),
    CGPointMake(37.0, 87.0),
    CGPointMake(0.0, 48.0),
  };
  CGPathAddLines(path, transform, points, sizeof(points) / sizeof(points[0]));
  CGPathRef result = CGPathCreateCopy(path);
  CGPathRelease(path);
  return CFAutorelease(result);
}

@end
