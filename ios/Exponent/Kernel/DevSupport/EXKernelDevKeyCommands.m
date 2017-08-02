// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrameReactAppManager.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernel.h"
#import "EXKernelBridgeRegistry.h"
#import "EXKernelReactAppManager.h"
#import "EXShellManager.h"

#import <React/RCTDefines.h>
#import <React/RCTUtils.h>

#import <UIKit/UIKit.h>

@interface EXKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation EXKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand
                             block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(EXKeyCommand *)object
{
  if (![object isKindOfClass:[EXKeyCommand class]]) {
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

@interface EXKernelDevKeyCommands ()

@property (nonatomic, strong) NSMutableSet<EXKeyCommand *> *commands;

@end

@implementation UIResponder (EXKeyCommands)

- (NSArray<UIKeyCommand *> *)EX_keyCommands
{
  NSSet<EXKeyCommand *> *commands = [EXKernelDevKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

- (void)EX_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.
  static NSTimeInterval lastCommand = 0;
  if (CACurrentMediaTime() - lastCommand > 0.5) {
    for (EXKeyCommand *command in [EXKernelDevKeyCommands sharedInstance].commands) {
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

@implementation EXKernelDevKeyCommands

+ (instancetype)sharedInstance
{
  static EXKernelDevKeyCommands *instance;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!instance) {
      instance = [[EXKernelDevKeyCommands alloc] init];
    }
  });
  return instance;
}

+ (void)initialize
{
  // capture keycommands across all bridges.
  // this is the same approach taken by RCTKeyCommands,
  // but that class is disabled in the expo react native fork
  // since there may be many instances of it.
  RCTSwapInstanceMethods([UIResponder class],
                         @selector(keyCommands),
                         @selector(EX_keyCommands));
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet set];
    _isLegacyMenuBehaviorEnabled = NO;
    [self _addDevCommands];
  }
  return self;
}

#pragma mark - expo dev commands

- (void)_addDevCommands
{
  __weak typeof(self) weakSelf = self;
  [self registerKeyCommandWithInput:@"d"
                      modifierFlags:UIKeyModifierCommand
                             action:^(__unused UIKeyCommand *_) {
                               [weakSelf _handleMenuCommand];
                             }];
  [self registerKeyCommandWithInput:@"r"
                      modifierFlags:UIKeyModifierCommand
                             action:^(__unused UIKeyCommand *_) {
                               [weakSelf _handleRefreshCommand];
                             }];
  [self registerKeyCommandWithInput:@"n"
                      modifierFlags:UIKeyModifierCommand
                             action:^(__unused UIKeyCommand *_) {
                               [weakSelf _handleDisableDebuggingCommand];
                             }];
  [self registerKeyCommandWithInput:@"i"
                      modifierFlags:UIKeyModifierCommand
                             action:^(__unused UIKeyCommand *_) {
                               [weakSelf _handleToggleInspectorCommand];
                             }];
  [self registerKeyCommandWithInput:@"k"
                      modifierFlags:UIKeyModifierCommand | UIKeyModifierControl
                             action:^(__unused UIKeyCommand *_) {
                               [weakSelf _handleKernelMenuCommand];
                             }];
}

- (void)_handleMenuCommand
{
  if ([EXShellManager sharedInstance].isDetached || _isLegacyMenuBehaviorEnabled) {
    [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager showDevMenu];
  } else {
    [[EXKernel sharedInstance] dispatchKernelJSEvent:@"switchTasks" body:@{} onSuccess:nil onFailure:nil];
  }
}

- (void)_handleRefreshCommand
{
  [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager reloadBridge];
}

- (void)_handleDisableDebuggingCommand
{
  [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager disableRemoteDebugging];
}

- (void)_handleToggleInspectorCommand
{
  [[EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager toggleElementInspector];
}

- (void)_handleKernelMenuCommand
{
  EXReactAppManager *foregroundAppManager = [EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager;
  if (foregroundAppManager == [EXKernel sharedInstance].bridgeRegistry.kernelAppManager) {
    [foregroundAppManager showDevMenu];
  }
}

#pragma mark - managing list of commands

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainQueue();
  
  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(EX_handleKeyCommand:)];
  
  EXKeyCommand *keyCommand = [[EXKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();
  
  for (EXKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();
  
  for (EXKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

