// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI26_0_0EXOAuthViewController;

@protocol ABI26_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI26_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI26_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI26_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI26_0_0EXOAuthViewControllerDelegate> delegate;

@end
