// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXDefines.h>
#import <EXCore/EXModule.h>

@protocol EXExportedModule <EXModule>

@optional

- (dispatch_queue_t)methodQueue;
- (NSDictionary *)constantsToExport;
- (void)bridgeDidBackground:(NSNotification *)notification;
- (void)bridgeDidForeground:(NSNotification *)notification;

@end
