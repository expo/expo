// Copyright 2024-present 650 Industries. All rights reserved.

#if TARGET_OS_IOS || TARGET_OS_TV

#import <UIKit/UIKit.h>

#elif TARGET_OS_OSX

#import <AppKit/AppKit.h>
#import <React/RCTUIKit.h>

@compatibility_alias UIView NSView;
@compatibility_alias UIResponder NSResponder;
@compatibility_alias UIColor NSColor;
@compatibility_alias UIWindow NSWindow;

#ifndef UIApplication
@compatibility_alias UIApplication NSApplication;
#endif

@protocol UIApplicationDelegate <NSApplicationDelegate> @end
@protocol UISceneDelegate <NSWindowDelegate> @end

#endif // TARGET_OS_OSX
