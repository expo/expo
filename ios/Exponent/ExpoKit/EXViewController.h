// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface EXViewController : UIViewController

/**
 *  Invoked from `viewDidLoad`
 */
- (void)createRootAppAndMakeVisible;

@property (nonatomic, strong) UIViewController *contentViewController;

@end
