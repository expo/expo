// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class ABI17_0_0EXOAuthViewController;

@protocol ABI17_0_0EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(ABI17_0_0EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(ABI17_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface ABI17_0_0EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<ABI17_0_0EXOAuthViewControllerDelegate> delegate;

@end
