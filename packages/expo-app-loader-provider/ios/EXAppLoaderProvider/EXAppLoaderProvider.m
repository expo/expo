// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppLoaderProvider/EXAppLoaderProvider.h>
#import <EXAppLoaderProvider/EXAppLoaderInterface.h>

static NSMutableDictionary<NSString *, Class> *EXProvidedAppLoaderClasses;

extern void EXRegisterAppLoader(NSString *, Class);
extern void EXRegisterAppLoader(NSString *loaderName, Class loaderClass)
{
  if ([loaderClass conformsToProtocol:@protocol(EXAppLoaderInterface)]) {
    if (!EXProvidedAppLoaderClasses) {
      EXProvidedAppLoaderClasses = [NSMutableDictionary new];
    }
    EXProvidedAppLoaderClasses[loaderName] = loaderClass;
  } else {
    NSLog(@"EXAppLoader class (%@) doesn't conform to the EXAppLoaderInterface protocol.", NSStringFromClass(loaderClass));
  }
}

@implementation EXAppLoaderProvider

- (nullable id<EXAppLoaderInterface>)createAppLoader:(NSString *)loaderName
{
  Class loaderClass = EXProvidedAppLoaderClasses[loaderName];
  return [loaderClass new];
}

# pragma mark - static

+ (nonnull instancetype)sharedInstance
{
  static EXAppLoaderProvider *loaderProvider;
  static dispatch_once_t once;

  dispatch_once(&once, ^{
    loaderProvider = [[EXAppLoaderProvider alloc] init];
  });
  return loaderProvider;
}

@end
