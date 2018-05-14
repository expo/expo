// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXDefines.h>
#import <EXCore/EXExportedModule.h>

@protocol EXViewManager <EXExportedModule>

- (UIView *)view;
- (NSString *)viewName;
- (NSArray<NSString *> *)supportedEvents;

@end
