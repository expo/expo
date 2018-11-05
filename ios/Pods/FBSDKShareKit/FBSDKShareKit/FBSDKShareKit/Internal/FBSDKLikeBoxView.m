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

#import "FBSDKLikeBoxView.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLikeBoxBorderView.h"

@implementation FBSDKLikeBoxView
{
  FBSDKLikeBoxBorderView *_borderView;
  UILabel *_likeCountLabel;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self _initializeContent];
  }
  return self;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [super initWithCoder:decoder])) {
    [self _initializeContent];
  }
  return self;
}

#pragma mark - Properties

- (void)setCaretPosition:(FBSDKLikeBoxCaretPosition)caretPosition
{
  if (_caretPosition != caretPosition) {
    _caretPosition = caretPosition;
    _borderView.caretPosition = _caretPosition;
    [self setNeedsLayout];
    [self invalidateIntrinsicContentSize];
  }
}

- (NSString *)text
{
  return _likeCountLabel.text;
}

- (void)setText:(NSString *)text
{
  if (![_likeCountLabel.text isEqualToString:text]) {
    _likeCountLabel.text = text;
    [self setNeedsLayout];
    [self invalidateIntrinsicContentSize];
  }
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize
{
  return _borderView.intrinsicContentSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect bounds = self.bounds;
  _borderView.frame = bounds;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  return [_borderView sizeThatFits:size];
}

#pragma mark - Helper Methods

- (void)_initializeContent
{
  _borderView = [[FBSDKLikeBoxBorderView alloc] initWithFrame:CGRectZero];
  [self addSubview:_borderView];

  _likeCountLabel = [[UILabel alloc] initWithFrame:CGRectZero];
  _likeCountLabel.font = [UIFont systemFontOfSize:11.0];
  _likeCountLabel.textAlignment = NSTextAlignmentCenter;
  _likeCountLabel.textColor = FBSDKUIColorWithRGB(0x6A, 0x71, 0x80);
  _borderView.contentView = _likeCountLabel;
}

@end
