// Copyright 2015-present 650 Industries. All rights reserved.

#if TARGET_OS_OSX

#import <EXDevMenu/RCTKeyCommands.h>

#pragma mark - RCTKeyCommand

@interface RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, readonly) NSEventModifierFlags flags;
@property (nonatomic, copy) void (^block)(NSEvent * _Nullable);

- (instancetype)initWithKey:(NSString *)key flags:(NSEventModifierFlags)flags block:(void (^)(NSEvent * _Nullable))block;
- (BOOL)matchesInput:(NSString *)input flags:(NSEventModifierFlags)flags;

@end

@implementation RCTKeyCommand

- (instancetype)initWithKey:(NSString *)key flags:(NSEventModifierFlags)flags block:(void (^)(NSEvent * _Nullable))block
{
  if ((self = [super init])) {
    _key = [key copy];
    _flags = flags;
    _block = [block copy];
  }
  return self;
}

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _key.hash ^ _flags;
}

- (BOOL)isEqual:(RCTKeyCommand *)object
{
  if (![object isKindOfClass:[RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.key flags:object.flags];
}

- (BOOL)matchesInput:(NSString *)input flags:(NSEventModifierFlags)flags
{
  // Mask to only compare the modifier keys we care about
  NSEventModifierFlags relevantFlags = NSEventModifierFlagCommand | NSEventModifierFlagControl |
                                       NSEventModifierFlagOption | NSEventModifierFlagShift;

  NSEventModifierFlags maskedSelfFlags = _flags & relevantFlags;
  NSEventModifierFlags maskedInputFlags = flags & relevantFlags;

  // We consider the key command a match if the modifier flags match exactly
  // or if the command has no modifier flags (for bare key presses like 'r')
  return [_key.lowercaseString isEqualToString:input.lowercaseString] &&
         (maskedSelfFlags == maskedInputFlags || maskedSelfFlags == 0);
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%lu hasBlock=%@>",
                                    [self class],
                                    self,
                                    _key,
                                    (unsigned long)_flags,
                                    _block ? @"YES" : @"NO"];
}

@end

#pragma mark - RCTKeyCommands

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<RCTKeyCommand *> *commands;
@property (nonatomic, strong) id localEventMonitor;

@end

@implementation RCTKeyCommands

+ (instancetype)sharedInstance
{
  static RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet new];
    [self setupEventMonitor];
  }
  return self;
}

- (void)dealloc
{
  [self removeEventMonitor];
}

- (void)setupEventMonitor
{
  if (_localEventMonitor) {
    return;
  }

  __weak typeof(self) weakSelf = self;
  _localEventMonitor = [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskKeyDown handler:^NSEvent * _Nullable(NSEvent * _Nonnull event) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      BOOL handled = [strongSelf handleKeyEvent:event];
      if (handled) {
        return nil; // Consume the event
      }
    }
    return event; // Pass through unhandled events
  }];
}

- (void)removeEventMonitor
{
  if (_localEventMonitor) {
    [NSEvent removeMonitor:_localEventMonitor];
    _localEventMonitor = nil;
  }
}

- (BOOL)handleKeyEvent:(NSEvent *)event
{
  NSString *characters = event.charactersIgnoringModifiers;
  if (characters.length == 0) {
    return NO;
  }

  NSEventModifierFlags modifierFlags = event.modifierFlags;

  // Collect commands to execute (avoid mutation during iteration)
  NSMutableArray<RCTKeyCommand *> *commandsToExecute = [NSMutableArray new];

  @synchronized (_commands) {
    for (RCTKeyCommand *command in _commands) {
      if ([command matchesInput:characters flags:modifierFlags]) {
        if (command.block) {
          [commandsToExecute addObject:command];
        }
      }
    }
  }

  // Execute matched commands
  for (RCTKeyCommand *command in commandsToExecute) {
    command.block(event);
  }

  return commandsToExecute.count > 0;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(NSEventModifierFlags)flags
                             action:(void (^)(NSEvent * _Nullable))block
{
  if (!input || input.length == 0) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    RCTKeyCommand *keyCommand = [[RCTKeyCommand alloc] initWithKey:input flags:flags block:block];
    @synchronized (self->_commands) {
      [self->_commands removeObject:keyCommand];
      [self->_commands addObject:keyCommand];
    }
  });
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(NSEventModifierFlags)flags
{
  if (!input || input.length == 0) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    @synchronized (self->_commands) {
      for (RCTKeyCommand *command in self->_commands.allObjects) {
        if ([command matchesInput:input flags:flags]) {
          [self->_commands removeObject:command];
          break;
        }
      }
    }
  });
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(NSEventModifierFlags)flags
{
  if (!input || input.length == 0) {
    return NO;
  }

  @synchronized (_commands) {
    for (RCTKeyCommand *command in _commands) {
      if ([command matchesInput:input flags:flags]) {
        return YES;
      }
    }
  }
  return NO;
}

@end

#endif
