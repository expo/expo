// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI15_0_0EXOAuthViewController;

@protocol ABI15_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI15_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI15_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI15_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI15_0_0EXOAuthViewControllerDelegate> delegate;

@end
