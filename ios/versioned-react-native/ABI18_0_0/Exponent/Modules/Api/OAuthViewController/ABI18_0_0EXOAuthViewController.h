// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI18_0_0EXOAuthViewController;

@protocol ABI18_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI18_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI18_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI18_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI18_0_0EXOAuthViewControllerDelegate> delegate;

@end
