// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXAppLifecycleListener <NSObject>

- (void)onAppBackgrounded;
- (void)onAppForegrounded;

@end
