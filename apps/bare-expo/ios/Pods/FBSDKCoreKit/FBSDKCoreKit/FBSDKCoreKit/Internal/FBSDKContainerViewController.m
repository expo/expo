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

#import "FBSDKContainerViewController.h"

@implementation FBSDKContainerViewController

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  if ([self.delegate respondsToSelector:@selector(viewControllerDidDisappear:animated:)]) {
    [self.delegate viewControllerDidDisappear:self animated:animated];
  }
}

- (void)displayChildController:(UIViewController *)childController
{
  [self addChildViewController:childController];
  UIView *view = self.view;
  UIView *childView = childController.view;
  childView.translatesAutoresizingMaskIntoConstraints = NO;
  childView.frame = view.frame;
  [view addSubview:childView];

  [view addConstraints:
   @[
     [NSLayoutConstraint constraintWithItem:childView
                                  attribute:NSLayoutAttributeTop
                                  relatedBy:NSLayoutRelationEqual
                                     toItem:view
                                  attribute:NSLayoutAttributeTop
                                 multiplier:1.0
                                   constant:0.0],

     [NSLayoutConstraint constraintWithItem:childView
                                  attribute:NSLayoutAttributeBottom
                                  relatedBy:NSLayoutRelationEqual
                                     toItem:view
                                  attribute:NSLayoutAttributeBottom
                                 multiplier:1.0
                                   constant:0.0],

     [NSLayoutConstraint constraintWithItem:childView
                                  attribute:NSLayoutAttributeLeading
                                  relatedBy:NSLayoutRelationEqual
                                     toItem:view
                                  attribute:NSLayoutAttributeLeading
                                 multiplier:1.0
                                   constant:0.0],

     [NSLayoutConstraint constraintWithItem:childView
                                  attribute:NSLayoutAttributeTrailing
                                  relatedBy:NSLayoutRelationEqual
                                     toItem:view
                                  attribute:NSLayoutAttributeTrailing
                                 multiplier:1.0
                                   constant:0.0],
   ]];

  [childController didMoveToParentViewController:self];
}

@end
