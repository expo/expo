// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI31_0_0EXOAuthViewController;

@protocol ABI31_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI31_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI31_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI31_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI31_0_0EXOAuthViewControllerDelegate> delegate;

@end
