// Copyright 2015-present 650 Industries. All rights reserved.

#if TARGET_OS_OSX

#import <AppKit/AppKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A macOS implementation of RCTKeyCommands that provides similar functionality
 * to the iOS version for handling keyboard shortcuts in the dev menu.
 */
@interface RCTKeyCommands : NSObject

+ (nullable instancetype)sharedInstance;

/**
 * Register a keyboard command.
 */
- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(NSEventModifierFlags)flags
                             action:(void (^)(NSEvent * _Nullable event))block;

/**
 * Unregister a keyboard command.
 */
- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(NSEventModifierFlags)flags;

/**
 * Check if a command is registered.
 */
- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(NSEventModifierFlags)flags;

@end

NS_ASSUME_NONNULL_END

#endif
