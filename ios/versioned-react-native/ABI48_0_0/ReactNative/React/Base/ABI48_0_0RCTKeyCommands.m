/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import <objc/message.h>
#import <objc/runtime.h>
#import "ABI48_0_0RCTDefines.h"
#import "ABI48_0_0RCTUtils.h"

#if TARGET_IPHONE_SIMULATOR

@interface UIEvent (UIPhysicalKeyboardEvent)

@property (nonatomic) NSString *_modifiedInput;
@property (nonatomic) NSString *_unmodifiedInput;
@property (nonatomic) UIKeyModifierFlags _modifierFlags;
@property (nonatomic) BOOL _isKeyDown;
@property (nonatomic) long _keyCode;

@end

@interface ABI48_0_0RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, readonly) UIKeyModifierFlags flags;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation ABI48_0_0RCTKeyCommand

- (instancetype)init:(NSString *)key flags:(UIKeyModifierFlags)flags block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _key = key;
    _flags = flags;
    _block = block;
  }
  return self;
}

ABI48_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _key.hash ^ _flags;
}

- (BOOL)isEqual:(ABI48_0_0RCTKeyCommand *)object
{
  if (![object isKindOfClass:[ABI48_0_0RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.key flags:object.flags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  // We consider the key command a match if the modifier flags match
  // exactly or is there are no modifier flags. This means that for
  // `cmd + r`, we will match both `cmd + r` and `r` but not `opt + r`.
  return [_key isEqual:input] && (_flags == flags || flags == 0);
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%lld hasBlock=%@>",
                                    [self class],
                                    self,
                                    _key,
                                    (long long)_flags,
                                    _block ? @"YES" : @"NO"];
}

@end

@interface ABI48_0_0RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<ABI48_0_0RCTKeyCommand *> *commands;

@end

@implementation ABI48_0_0RCTKeyCommands

- (void)handleKeyUIEventSwizzle:(UIEvent *)event
{
  NSString *modifiedInput = nil;
  UIKeyModifierFlags modifierFlags = 0;
  BOOL isKeyDown = NO;

  if ([event respondsToSelector:@selector(_modifiedInput)]) {
    modifiedInput = [event _modifiedInput];
  }

  if ([event respondsToSelector:@selector(_modifierFlags)]) {
    modifierFlags = [event _modifierFlags];
  }

  if ([event respondsToSelector:@selector(_isKeyDown)]) {
    isKeyDown = [event _isKeyDown];
  }

  BOOL interactionEnabled = !ABI48_0_0RCTSharedApplication().isIgnoringInteractionEvents;
  BOOL hasFirstResponder = NO;
  if (isKeyDown && modifiedInput.length > 0 && interactionEnabled) {
    UIResponder *firstResponder = nil;
    for (UIWindow *window in [self allWindows]) {
      firstResponder = [window valueForKey:@"firstResponder"];
      if (firstResponder) {
        hasFirstResponder = YES;
        break;
      }
    }

    // Ignore key commands (except escape) when there's an active responder
    if (!firstResponder) {
      [self ABI48_0_0RCT_handleKeyCommand:modifiedInput flags:modifierFlags];
    }
  }
};

- (NSArray<UIWindow *> *)allWindows
{
  BOOL includeInternalWindows = YES;
  BOOL onlyVisibleWindows = NO;

  // Obfuscating selector allWindowsIncludingInternalWindows:onlyVisibleWindows:
  NSArray<NSString *> *allWindowsComponents =
      @[ @"al", @"lWindo", @"wsIncl", @"udingInt", @"ernalWin", @"dows:o", @"nlyVisi", @"bleWin", @"dows:" ];
  SEL allWindowsSelector = NSSelectorFromString([allWindowsComponents componentsJoinedByString:@""]);

  NSMethodSignature *methodSignature = [[UIWindow class] methodSignatureForSelector:allWindowsSelector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];

  invocation.target = [UIWindow class];
  invocation.selector = allWindowsSelector;
  [invocation setArgument:&includeInternalWindows atIndex:2];
  [invocation setArgument:&onlyVisibleWindows atIndex:3];
  [invocation invoke];

  __unsafe_unretained NSArray<UIWindow *> *windows = nil;
  [invocation getReturnValue:&windows];
  return windows;
}

- (void)ABI48_0_0RCT_handleKeyCommand:(NSString *)input flags:(UIKeyModifierFlags)modifierFlags
{
  for (ABI48_0_0RCTKeyCommand *command in [ABI48_0_0RCTKeyCommands sharedInstance].commands) {
    if ([command matchesInput:input flags:modifierFlags]) {
      if (command.block) {
        command.block(nil);
      }
    }
  }
}

+ (instancetype)sharedInstance
{
  static ABI48_0_0RCTKeyCommands *sharedInstance;
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
  ABI48_0_0RCTAssertMainQueue();

  ABI48_0_0RCTKeyCommand *keyCommand = [[ABI48_0_0RCTKeyCommand alloc] init:input flags:flags block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI48_0_0RCTAssertMainQueue();

  for (ABI48_0_0RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  ABI48_0_0RCTAssertMainQueue();

  for (ABI48_0_0RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation ABI48_0_0RCTKeyCommands

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
