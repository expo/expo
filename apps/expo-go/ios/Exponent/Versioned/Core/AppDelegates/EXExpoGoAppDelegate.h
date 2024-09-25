#import <RCTAppDelegate.h>
#import <React/RCTRootView.h>
#import "EXVersionManagerObjC.h"


@interface EXExpoGoAppDelegate : RCTAppDelegate

@property(nonatomic, strong) NSURL* sourceURL;
@property(nonatomic, strong) EXVersionManagerObjC* manager;

- (RCTRootViewFactory *)createRCTRootViewFactory;

@end
