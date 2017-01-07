// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI13_0_0EXOAuthViewController;

@protocol ABI13_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI13_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI13_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI13_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI13_0_0EXOAuthViewControllerDelegate> delegate;

@end
