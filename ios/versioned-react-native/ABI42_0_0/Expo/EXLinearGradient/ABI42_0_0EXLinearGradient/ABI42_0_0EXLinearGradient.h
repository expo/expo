// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistry.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleListener.h>

@interface ABI42_0_0EXLinearGradient : UIView

- (void)setColors:(NSArray *)colorStrings;
- (void)setLocations:(NSArray *)locations;
- (void)setStartPoint:(CGPoint)start;
- (void)setEndPoint:(CGPoint)end;

@end
