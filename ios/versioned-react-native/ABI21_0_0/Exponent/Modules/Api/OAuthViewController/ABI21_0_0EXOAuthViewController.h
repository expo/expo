// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI21_0_0EXOAuthViewController;

@protocol ABI21_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI21_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI21_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI21_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI21_0_0EXOAuthViewControllerDelegate> delegate;

@end
