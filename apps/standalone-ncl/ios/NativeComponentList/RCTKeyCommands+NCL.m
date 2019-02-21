//
//  UIResponder+NCLKeyCommands.m
//  NativeComponentList
//
//  Created by Stanisław Chmiela on 08/02/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTKeyCommands+NCL.h"
#import <React/RCTKeyCommands.h>
#import <React/RCTUtils.h>

@interface RCTKeyCommands (Private)

@property (nonatomic, strong) NSMutableSet<id> *commands;

@end

@implementation RCTKeyCommands (NCLKeyCommands)

+ (void)initialize
{
  // swizzle UIResponder
  RCTSwapInstanceMethods([UIResponder class],
                         @selector(keyCommands),
                         @selector(RCT_keyCommands));
}

- (NSArray<UIKeyCommand *> *)RCT_keyCommands
{
  NSSet<id> *commands = [RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

@end
