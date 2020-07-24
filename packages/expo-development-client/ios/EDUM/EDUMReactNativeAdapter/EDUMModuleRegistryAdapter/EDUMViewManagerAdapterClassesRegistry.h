// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EDUMViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of EDUMViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to React, let's cache these classes and not create them twice.

@interface EDUMViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(EDUMViewManager *)viewManager;

@end
