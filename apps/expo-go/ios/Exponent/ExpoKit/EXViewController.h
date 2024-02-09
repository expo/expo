// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class EXViewController;
@class EXKernelAppRecord;

@protocol EXViewControllerDelegate <NSObject>

- (void)viewController:(EXViewController * _Nonnull)vc didNavigateAppToVisible:(EXKernelAppRecord * _Nonnull)appRecord;

@end

@interface EXViewController : UIViewController

/**
 *  Invoked from `viewDidLoad`
 */
- (void)createRootAppAndMakeVisible;

@property (nonatomic, strong, nullable) UIViewController *contentViewController;
@property (nonatomic, weak, nullable) id<EXViewControllerDelegate> delegate;

@end
