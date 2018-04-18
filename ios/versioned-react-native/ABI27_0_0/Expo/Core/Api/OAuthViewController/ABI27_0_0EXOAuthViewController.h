// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI27_0_0EXOAuthViewController;

@protocol ABI27_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI27_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI27_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI27_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI27_0_0EXOAuthViewControllerDelegate> delegate;

@end
