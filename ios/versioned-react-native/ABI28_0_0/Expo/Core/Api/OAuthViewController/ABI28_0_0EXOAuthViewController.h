// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI28_0_0EXOAuthViewController;

@protocol ABI28_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI28_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI28_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI28_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI28_0_0EXOAuthViewControllerDelegate> delegate;

@end
