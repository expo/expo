// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXEnvironment.h"
#import "EXKernelDevKeyCommands.h"
#import "EXKernel.h"
#import "EXKernelAppRegistry.h"
#import "EXReactAppManager.h"

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
+ (void)handleKeyboardEvent:(UIEvent *)event;

@end

#if TARGET_IPHONE_SIMULATOR
@interface UIEvent (UIPhysicalKeyboardEvent)

@property (nonatomic) NSString *_modifiedInput;
@property (nonatomic) NSString *_unmodifiedInput;
@property (nonatomic) UIKeyModifierFlags _modifierFlags;
@property (nonatomic) BOOL _isKeyDown;
@property (nonatomic) long _keyCode;

@end

@implementation UIApplication (EXKeyCommands)

- (void)EX_handleKeyUIEventSwizzle:(UIEvent *)event
{
  BOOL interactionEnabled = !UIApplication.sharedApplication.isIgnoringInteractionEvents;
  BOOL hasFirstResponder = NO;
  [EXKernelDevKeyCommands handleKeyboardEvent:event];
  
  if (interactionEnabled) {
    UIResponder *firstResponder = nil;
    for (UIWindow *window in [self windows]) {
      firstResponder = [window valueForKey:@"firstResponder"];
      if (firstResponder) {
        hasFirstResponder = YES;
        break;
      }
    }
    
    
    // Call the original swizzled method
    [self EX_handleKeyUIEventSwizzle:event];
    
    if (firstResponder) {
      BOOL isTextField = [firstResponder isKindOfClass: [UITextField class]] || [firstResponder isKindOfClass: [UITextView class]];
      
      // this is a runtime header that is not publicly exported from the Webkit.framework
      // obfuscating selector WKContentView
      NSArray<NSString *> *webViewClass = @[ @"WKCo", @"ntentVi", @"ew"];
      Class WKContentView = NSClassFromString([webViewClass componentsJoinedByString:@""]);
      
      BOOL isWebView = [firstResponder isKindOfClass:[WKContentView class]];
      
      if (!isTextField && !isWebView) {
        [EXKernelDevKeyCommands handleKeyboardEvent:event];
      }
    }
  }
};

@end
#endif

@implementation UIResponder (EXKeyCommands)

- (NSArray<UIKeyCommand *> *)EX_keyCommands
{
  if ([self isKindOfClass:[UITextView class]] || [self isKindOfClass:[UITextField class]]) {
    return @[];
  }
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

#if TARGET_IPHONE_SIMULATOR
  SEL originalKeyboardSelector = NSSelectorFromString(@"handleKeyUIEvent:");
  RCTSwapInstanceMethods([UIApplication class],
                         originalKeyboardSelector,
                         @selector(EX_handleKeyUIEventSwizzle:));
#endif
}

#if TARGET_IPHONE_SIMULATOR
+(void)handleKeyboardEvent:(UIEvent *)event
{
  static NSTimeInterval lastCommand = 0;

  if (event._isKeyDown) {
    if (CACurrentMediaTime() - lastCommand > 0.5) {
      NSString *input = event._modifiedInput;
      if ([input isEqualToString: @"r"]) {
        [[EXKernel sharedInstance] reloadVisibleApp];
      }
      
      lastCommand = CACurrentMediaTime();
    }
  }
}
#endif

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet set];
  }
  return self;
}

#pragma mark - expo dev commands

- (void)registerDevCommands
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
  [[EXKernel sharedInstance] switchTasks];
}

- (void)_handleRefreshCommand
{
  // This reloads only JS
  //  [[EXKernel sharedInstance].visibleApp.appManager reloadBridge];

  // This reloads manifest and JS
  [[EXKernel sharedInstance] reloadVisibleApp];
}

- (void)_handleDisableDebuggingCommand
{
  [[EXKernel sharedInstance].visibleApp.appManager disableRemoteDebugging];
}

- (void)_handleToggleRemoteDebuggingCommand
{
  [[EXKernel sharedInstance].visibleApp.appManager toggleRemoteDebugging];
  // This reloads manifest and JS
  [[EXKernel sharedInstance] reloadVisibleApp];
}

- (void)_handleTogglePerformanceMonitorCommand
{
  [[EXKernel sharedInstance].visibleApp.appManager togglePerformanceMonitor];
}

- (void)_handleToggleInspectorCommand
{
  [[EXKernel sharedInstance].visibleApp.appManager toggleElementInspector];
}

- (void)_handleKernelMenuCommand
{
  if ([EXKernel sharedInstance].visibleApp == [EXKernel sharedInstance].appRegistry.homeAppRecord) {
    [[EXKernel sharedInstance].appRegistry.homeAppRecord.appManager showDevMenu];
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

