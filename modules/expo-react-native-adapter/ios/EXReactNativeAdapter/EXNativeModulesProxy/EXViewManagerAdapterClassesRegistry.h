// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EXCore/EXViewManager.h>

@interface EXViewManagerAdapterClassesRegistry : NSObject

+ (instancetype)sharedInstance;
- (Class)viewManagerAdapterClassForViewManager:(id<EXViewManager>)viewManager;

@end
