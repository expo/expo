// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EXCore/EXViewManager.h>

// A registry for view manager adapter classes.
// As we have to create subclasses of EXViewManagerAdapters
// at runtime to be able to respond with proper + (NSString *)moduleName
// to React, let's cache these classes and not create them twice.

@interface EXViewManagerAdapterClassesRegistry : NSObject

- (Class)viewManagerAdapterClassForViewManager:(EXViewManager *)viewManager;

@end
