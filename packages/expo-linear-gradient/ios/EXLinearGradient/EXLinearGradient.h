// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXAppLifecycleListener.h>

@interface EXLinearGradient : UIView

- (void)setColors:(NSArray *)colorStrings;
- (void)setLocations:(NSArray *)locations;
- (void)setStartPoint:(CGPoint)start;
- (void)setEndPoint:(CGPoint)end;

@end
