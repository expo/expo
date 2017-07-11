// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXFatalHandler.h"
#import "EXKernel.h"
#import "EXViewController.h"

#import <CocoaLumberjack/CocoaLumberjack.h>

RCTFatalHandler handleFatalReactError = ^(NSError *error) {
  dispatch_async(dispatch_get_main_queue(), ^{
    // generally we want to show a human-readable error, since RCTRedBox is disabled in production.
    // in the case that EXFrame failed to load, this is actually non-fatal and will instead
    // get handled by RCTJavaScriptDidFailToLoadNotification.
    BOOL isFrameError = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager errorBelongsToExperience:error];

    if (!isFrameError) {
      [[EXKernel sharedInstance].rootViewController
       showErrorWithType:kEXFatalErrorTypeException
       error:error];
    }
  });
};
