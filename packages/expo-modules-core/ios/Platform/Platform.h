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
@compatibility_alias UIHostingController NSHostingController;
@compatibility_alias UIImage NSImage;
@compatibility_alias UIImageView NSImageView;

// `@compatibility_alias` doesn't define a preprocessor macro, so `#ifndef
// UIApplication` never detected that `React/RCTUIKit.h` (imported above)
// already declares this same alias. Under Swift Explicit Modules, that
// duplicate declaration becomes a real Clang conflict. Guard on the
// header's presence instead.
#if !__has_include(<React/RCTUIKit.h>)
@compatibility_alias UIApplication NSApplication;
#endif

@protocol UIApplicationDelegate <NSApplicationDelegate> @end
@protocol UISceneDelegate <NSWindowDelegate> @end

#endif // TARGET_OS_OSX
