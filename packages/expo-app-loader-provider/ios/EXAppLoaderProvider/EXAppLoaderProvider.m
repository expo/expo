// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppLoaderProvider/EXAppLoaderProvider.h>
#import <EXAppLoaderProvider/EXAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *providedAppLoaderClasses;

extern void EXRegisterAppLoader(NSString *, Class);
extern void EXRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(EXAppLoaderInterface)]) {
    if (!providedAppLoaderClasses) {
      providedAppLoaderClasses = [NSMutableDictionary new];
    }
    [providedAppLoaderClasses setObject:loaderClass forKey:loaderName];
  } else {
    NSLog(@"EXAppLoader class (%@) doesn't conform to EXAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation EXAppLoaderProvider

- (nullable id<EXAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = [providedAppLoaderClasses objectForKey:loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static EXAppLoaderProvider *loaderProvider = nil;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    if (loaderProvider == nil) {
      loaderProvider = [[EXAppLoaderProvider alloc] init];
    }
  });
  return loaderProvider;
}

@end
