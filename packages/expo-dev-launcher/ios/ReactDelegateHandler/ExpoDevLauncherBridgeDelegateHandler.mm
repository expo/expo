#import "ExpoDevLauncherBridgeDelegateHandler.h"
#import "EXDevLauncherController.h"


@implementation ExpoDevLauncherBridgeDelegateHandler

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceUrl];
}

@end
