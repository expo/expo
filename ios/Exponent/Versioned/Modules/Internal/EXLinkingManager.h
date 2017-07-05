// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXScopedEventEmitter.h"

@protocol EXLinkingManagerScopedModuleDelegate

- (void)linkingModule:(id)linkingModule didOpenUrl:(NSString *)url;

@end

@interface EXLinkingManager : EXScopedEventEmitter

- (void)dispatchOpenUrlEvent: (NSURL *)url;

@end
