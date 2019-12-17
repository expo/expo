//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/EXScreenOrientationRegistry.h>
#import <UMCore/UMDefines.h>

@interface EXScreenOrientationRegistry ()

@property (nonatomic, strong) NSMapTable<id, NSNumber *> *moduleMaskRegistry;
@property (nonatomic, weak) id foregroudModule;

@end

@implementation EXScreenOrientationRegistry

UM_REGISTER_SINGLETON_MODULE(EXScreenOrientationRegistry)

- (instancetype)init
{
  if (self = [super init]) {
    _moduleMaskRegistry =  [NSMapTable weakToStrongObjectsMapTable];
  }
  
  return self;
}

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module {
  [_moduleMaskRegistry setObject:@(mask) forKey:module];
}

- (UIInterfaceOrientationMask)currentOrientationMask
{
  NSNumber *current = [_moduleMaskRegistry objectForKey:_foregroudModule];
  if (!current) {
    return 0;
  }
  
  return [current intValue];
}

- (void)moduleDidForeground:(id)module
{
  _foregroudModule = module;
}

- (void)moduleWillDeallocate:(id)module
{
  [_moduleMaskRegistry removeObjectForKey:module];
}

@end
