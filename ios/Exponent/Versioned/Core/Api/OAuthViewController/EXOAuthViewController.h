// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@class EXOAuthViewController;

@protocol EXOAuthViewControllerDelegate <NSObject>

-(void)oAuthViewControlerDidCancel:(EXOAuthViewController *)viewController;
-(void)oAuthViewControler:(EXOAuthViewController *)viewController didReceiveResult:(NSString *)result;

@end

@interface EXOAuthViewController : UIViewController

@property (nonatomic, strong) NSString *url;
@property (nonatomic, weak) id<EXOAuthViewControllerDelegate> delegate;

@end
