/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "ABI7_0_0RCTDefines.h"
#import "ABI7_0_0RCTUtils.h"

#if ABI7_0_0RCT_DEV

static BOOL ABI7_0_0RCTIsIOS8OrEarlier()
{
  return [UIDevice currentDevice].systemVersion.floatValue < 9;
}

@interface ABI7_0_0RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation ABI7_0_0RCTKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand
                             block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block;
  }
  return self;
}

ABI7_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(ABI7_0_0RCTKeyCommand *)object
{
  if (![object isKindOfClass:[ABI7_0_0RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.keyCommand.input
                      flags:object.keyCommand.modifierFlags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  return [_keyCommand.input isEqual:input] && _keyCommand.modifierFlags == flags;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%zd hasBlock=%@>",
          [self class], self, _keyCommand.input, _keyCommand.modifierFlags,
          _block ? @"YES" : @"NO"];
}

@end

@interface ABI7_0_0RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<ABI7_0_0RCTKeyCommand *> *commands;

@end

@implementation UIResponder (ABI7_0_0RCTKeyCommands)

- (NSArray<UIKeyCommand *> *)ABI7_0_0RCT_keyCommands
{
  NSSet<ABI7_0_0RCTKeyCommand *> *commands = [ABI7_0_0RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

- (void)ABI7_0_0RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.

  static NSTimeInterval lastCommand = 0;
  if (ABI7_0_0RCTIsIOS8OrEarlier() || CACurrentMediaTime() - lastCommand > 0.5) {
    for (ABI7_0_0RCTKeyCommand *command in [ABI7_0_0RCTKeyCommands sharedInstance].commands) {
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

@implementation UIApplication (ABI7_0_0RCTKeyCommands)

// Required for iOS 8.x
- (BOOL)ABI7_0_0RCT_sendAction:(SEL)action to:(id)target from:(id)sender forEvent:(UIEvent *)event
{
  if (action == @selector(ABI7_0_0RCT_handleKeyCommand:)) {
    [self ABI7_0_0RCT_handleKeyCommand:sender];
    return YES;
  }
  return [self ABI7_0_0RCT_sendAction:action to:target from:sender forEvent:event];
}

@end

@implementation ABI7_0_0RCTKeyCommands

+ (void)initialize
{
  if (ABI7_0_0RCTIsIOS8OrEarlier()) {

    //swizzle UIApplication
    ABI7_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           @selector(ABI7_0_0RCT_keyCommands));

    ABI7_0_0RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           @selector(ABI7_0_0RCT_sendAction:to:from:forEvent:));
  } else {

    //swizzle UIResponder
    ABI7_0_0RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           @selector(ABI7_0_0RCT_keyCommands));
  }
}

+ (instancetype)sharedInstance
{
  static ABI7_0_0RCTKeyCommands *sharedInstance;
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
  ABI7_0_0RCTAssertMainThread();

  if (input.length && flags && ABI7_0_0RCTIsIOS8OrEarlier()) {

    // Workaround around the first cmd not working: http://openradar.appspot.com/19613391
    // You can register just the cmd key and do nothing. This ensures that
    // command-key modified commands will work first time. Fixed in iOS 9.

    [self registerKeyCommandWithInput:@""
                        modifierFlags:flags
                               action:nil];
  }

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(ABI7_0_0RCT_handleKeyCommand:)];

  ABI7_0_0RCTKeyCommand *keyCommand = [[ABI7_0_0RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  ABI7_0_0RCTAssertMainThread();

  for (ABI7_0_0RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  ABI7_0_0RCTAssertMainThread();

  for (ABI7_0_0RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation ABI7_0_0RCTKeyCommands

+ (instancetype)sharedInstance
{
  return nil;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block {}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags {}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

@end

#endif
