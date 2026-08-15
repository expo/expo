#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModule.h>
#import "EXPerfMonitorDataSource.h"

@interface EXExpoPerfMonitor : NSObject <RCTBridgeModule, RCTTurboModule, RCTInvalidating, EXPerfMonitorDataSourceDelegate>

- (void)show;
- (void)hide;
- (void)updateHost:(nullable RCTHost *)host;

@end
