/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "ABI42_0_0RCTDefines.h"
#import "ABI42_0_0RCTUtils.h"

#if ABI42_0_0RCT_DEV

@interface ABI42_0_0RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation ABI42_0_0RCTKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block;
  }
  return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(ABI42_0_0RCTKeyCommand *)object
{
  if (![object isKindOfClass:[ABI42_0_0RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.keyCommand.input flags:object.keyCommand.modifierFlags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  return [_keyCommand.input isEqual:input] && _keyCommand.modifierFlags == flags;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%lld hasBlock=%@>",
                                    [self class],
                                    self,
                                    _keyCommand.input,
                                    (long long)_keyCommand.modifierFlags,
                                    _block ? @"YES" : @"NO"];
}

@end

@interface ABI42_0_0RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<ABI42_0_0RCTKeyCommand *> *commands;

@end

@implementation UIResponder (ABI42_0_0RCTKeyCommands)

+ (UIResponder *)ABI42_0_0RCT_getFirstResponder:(UIResponder *)view
{
  UIResponder *firstResponder = nil;

  if (view.isFirstResponder) {
    return view;
  } else if ([view isKindOfClass:[UIViewController class]]) {
    if ([(UIViewController *)view parentViewController]) {
      firstResponder = [UIResponder ABI42_0_0RCT_getFirstResponder:[(UIViewController *)view parentViewController]];
    }
    return firstResponder ? firstResponder : [UIResponder ABI42_0_0RCT_getFirstResponder:[(UIViewController *)view view]];
  } else if ([view isKindOfClass:[UIView class]]) {
    for (UIView *subview in [(UIView *)view subviews]) {
      firstResponder = [UIResponder ABI42_0_0RCT_getFirstResponder:subview];
      if (firstResponder) {
        return firstResponder;
      }
    }
  }

  return firstResponder;
}

- (NSArray<UIKeyCommand *> *)ABI42_0_0RCT_keyCommands
{
  NSSet<ABI42_0_0RCTKeyCommand *> *commands = [ABI42_0_0RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

/**
 * Single Press Key Command Response
 * Command + KeyEvent (Command + R/D, etc.)
 */
- (void)ABI42_0_0RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.
  static NSTimeInterval lastCommand = 0;
  if (CACurrentMediaTime() - lastCommand > 0.5) {
    for (ABI42_0_0RCTKeyCommand *command in [ABI42_0_0RCTKeyCommands sharedInstance].commands) {
      if ([command.keyCommand.input isEqualToString:key.input] &&
          command.keyCommand.modifierFlags == key.modifierFlags) {
        if (command.block) {
          command.block(key);
          lastCommand = CACurrentMediaTime();
        }
      }
    }
  }
}

/**
 * Double Press Key Command Response
 * Double KeyEvent (Double R, etc.)
 */
- (void)ABI42_0_0RCT_handleDoublePressKeyCommand:(UIKeyCommand *)key
{
  static BOOL firstPress = YES;
  static NSTimeInterval lastCommand = 0;
  static NSTimeInterval lastDoubleCommand = 0;
  static NSString *lastInput = nil;
  static UIKeyModifierFlags lastModifierFlags = 0;

  if (firstPress) {
    for (ABI42_0_0RCTKeyCommand *command in [ABI42_0_0RCTKeyCommands sharedInstance].commands) {
      if ([command.keyCommand.input isEqualToString:key.input] &&
          command.keyCommand.modifierFlags == key.modifierFlags && command.block) {
        firstPress = NO;
        lastCommand = CACurrentMediaTime();
        lastInput = key.input;
        lastModifierFlags = key.modifierFlags;
        return;
      }
    }
  } else {
    // Second keyevent within 0.2 second,
    // with the same key as the first one.
    if (CACurrentMediaTime() - lastCommand < 0.2 && lastInput == key.input && lastModifierFlags == key.modifierFlags) {
      for (ABI42_0_0RCTKeyCommand *command in [ABI42_0_0RCTKeyCommands sharedInstance].commands) {
        if ([command.keyCommand.input isEqualToString:key.input] &&
            command.keyCommand.modifierFlags == key.modifierFlags && command.block) {
          // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
          // method gets called repeatedly if the command key is held down.
          if (CACurrentMediaTime() - lastDoubleCommand > 0.5) {
            command.block(key);
            lastDoubleCommand = CACurrentMediaTime();
          }
          firstPress = YES;
          return;
        }
      }
    }

    lastCommand = CACurrentMediaTime();
    lastInput = key.input;
    lastModifierFlags = key.modifierFlags;
  }
}

@end

@implementation ABI42_0_0RCTKeyCommands

+ (instancetype)sharedInstance
{
  static ABI42_0_0RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet new];
  }
  return self;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  ABI42_0_0RCTAssertMainQueue();

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(ABI42_0_0RCT_handleKeyCommand:)];

  ABI42_0_0RCTKeyCommand *keyCommand = [[ABI42_0_0RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI42_0_0RCTAssertMainQueue();

  for (ABI42_0_0RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI42_0_0RCTAssertMainQueue();

  for (ABI42_0_0RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

- (void)registerDoublePressKeyCommandWithInput:(NSString *)input
                                 modifierFlags:(UIKeyModifierFlags)flags
                                        action:(void (^)(UIKeyCommand *))block
{
  ABI42_0_0RCTAssertMainQueue();

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(ABI42_0_0RCT_handleDoublePressKeyCommand:)];

  ABI42_0_0RCTKeyCommand *keyCommand = [[ABI42_0_0RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterDoublePressKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI42_0_0RCTAssertMainQueue();

  for (ABI42_0_0RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isDoublePressKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI42_0_0RCTAssertMainQueue();

  for (ABI42_0_0RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation ABI42_0_0RCTKeyCommands

+ (instancetype)sharedInstance
{
  return nil;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

- (void)registerDoublePressKeyCommandWithInput:(NSString *)input
                                 modifierFlags:(UIKeyModifierFlags)flags
                                        action:(void (^)(UIKeyCommand *))block
{
}

- (void)unregisterDoublePressKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
}

- (BOOL)isDoublePressKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

@end

#endif
