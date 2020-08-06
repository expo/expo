#import <Foundation/Foundation.h>
#import <EXUpdates/EXUpdatesAppController.h>
#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>

#import <UMCore/UMAppDelegateWrapper.h>

#import <EXDevelopmentClientController.h>
@import EXDevMenu;

@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate, EXDevelopmentClientControllerDelegate, DevMenuDelegateProtocol>

@end
