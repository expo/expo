/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "ABI43_0_0RCTDefines.h"
#import "ABI43_0_0RCTUtils.h"

#if ABI43_0_0RCT_DEV

@interface ABI43_0_0RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation ABI43_0_0RCTKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block;
  }
  return self;
}

ABI43_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(ABI43_0_0RCTKeyCommand *)object
{
  if (![object isKindOfClass:[ABI43_0_0RCTKeyCommand class]]) {
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

@interface ABI43_0_0RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<ABI43_0_0RCTKeyCommand *> *commands;

@end

@implementation UIResponder (ABI43_0_0RCTKeyCommands)

+ (UIResponder *)ABI43_0_0RCT_getFirstResponder:(UIResponder *)view
{
  UIResponder *firstResponder = nil;

  if (view.isFirstResponder) {
    return view;
  } else if ([view isKindOfClass:[UIViewController class]]) {
    if ([(UIViewController *)view parentViewController]) {
      firstResponder = [UIResponder ABI43_0_0RCT_getFirstResponder:[(UIViewController *)view parentViewController]];
    }
    return firstResponder ? firstResponder : [UIResponder ABI43_0_0RCT_getFirstResponder:[(UIViewController *)view view]];
  } else if ([view isKindOfClass:[UIView class]]) {
    for (UIView *subview in [(UIView *)view subviews]) {
      firstResponder = [UIResponder ABI43_0_0RCT_getFirstResponder:subview];
      if (firstResponder) {
        return firstResponder;
      }
    }
  }

  return firstResponder;
}

- (NSArray<UIKeyCommand *> *)ABI43_0_0RCT_keyCommands
{
  NSSet<ABI43_0_0RCTKeyCommand *> *commands = [ABI43_0_0RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

/**
 * Single Press Key Command Response
 * Command + KeyEvent (Command + R/D, etc.)
 */
- (void)ABI43_0_0RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.
  static NSTimeInterval lastCommand = 0;
  if (CACurrentMediaTime() - lastCommand > 0.5) {
    for (ABI43_0_0RCTKeyCommand *command in [ABI43_0_0RCTKeyCommands sharedInstance].commands) {
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

@end

@implementation ABI43_0_0RCTKeyCommands

+ (instancetype)sharedInstance
{
  static ABI43_0_0RCTKeyCommands *sharedInstance;
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
  ABI43_0_0RCTAssertMainQueue();

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(ABI43_0_0RCT_handleKeyCommand:)];

  ABI43_0_0RCTKeyCommand *keyCommand = [[ABI43_0_0RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI43_0_0RCTAssertMainQueue();

  for (ABI43_0_0RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI43_0_0RCTAssertMainQueue();

  for (ABI43_0_0RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation ABI43_0_0RCTKeyCommands

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

@end

#endif
