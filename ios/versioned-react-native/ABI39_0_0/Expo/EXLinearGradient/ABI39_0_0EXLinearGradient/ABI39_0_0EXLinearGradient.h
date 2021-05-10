// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleListener.h>

@interface ABI39_0_0EXLinearGradient : UIView

- (void)setColors:(NSArray *)colorStrings;
- (void)setLocations:(NSArray *)locations;
- (void)setStartPoint:(CGPoint)start;
- (void)setEndPoint:(CGPoint)end;

@end
