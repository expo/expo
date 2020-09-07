//
//  NSViewController+SEGScreen.h
//  Analytics
//
//  Created by Cody Garvin on 7/8/20.
//  Copyright © 2020 Segment. All rights reserved.
//

#import "SEGSerializableValue.h"

#if TARGET_OS_OSX
#import <Cocoa/Cocoa.h>

@interface NSViewController (SEGScreen)

+ (void)seg_swizzleViewDidAppear;
+ (NSViewController *)seg_rootViewControllerFromView:(NSView *)view;

@end

#endif
