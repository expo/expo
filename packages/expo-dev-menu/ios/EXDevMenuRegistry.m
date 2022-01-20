//
//  EXDevMenuInstanceRegistry.m
//  Pods
//
//  Created by andrew on 2022-01-20.
//

#import "EXDevMenuRegistry.h"

@interface EXDevMenuRegistry()

@property (strong, nonatomic) NSMapTable *lookup;

@end

@implementation EXDevMenuRegistry

+ (instancetype)sharedInstance
{
  static EXDevMenuRegistry *registry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!registry) {
      registry = [[EXDevMenuRegistry alloc] init];
    }
  });
  return registry;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.lookup = [NSMapTable weakToStrongObjectsMapTable];
  }
  
  return self;
}

+ (void)registerWithBridge:(RCTBridge *)bridge andManifest:(NSDictionary *)manifest
{
  EXDevMenuInstance *instance = [[EXDevMenuInstance alloc] initWithBridge:bridge andManifest:manifest];
  [EXDevMenuRegistry registerWithInstance:instance];
}

+ (void)registerWithInstance:(EXDevMenuInstance *)instance
{
  EXDevMenuRegistry *registry = [EXDevMenuRegistry sharedInstance];
  [registry.lookup setObject:instance forKey:instance.bridge];
  [registry.lookup setObject:instance forKey:instance.appBridge];
}

+ (EXDevMenuInstance *)getInstanceForBridge:(RCTBridge *)bridge
{
  EXDevMenuRegistry *registry = [EXDevMenuRegistry sharedInstance];
  EXDevMenuInstance *instance = [registry.lookup objectForKey:bridge];
  
  if (instance == nil) {
    // uh oh
  }
  
  return instance;
}

+ (void)removeBridge:(RCTBridge *)bridge
{
  EXDevMenuRegistry *registry = [EXDevMenuRegistry sharedInstance];
  EXDevMenuInstance *instance = [registry.lookup objectForKey:bridge];
  
  [registry.lookup removeObjectForKey:instance.bridge];
  [registry.lookup removeObjectForKey:instance.appBridge];
}

@end
