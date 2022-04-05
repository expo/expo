// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXUtilities.h>

@interface EXUtilities ()

@property (nonatomic, nullable, weak) EXModuleRegistry *moduleRegistry;

@end

@protocol EXUtilService

- (UIViewController *)currentViewController;

- (nullable NSDictionary *)launchOptions;

@end

@implementation EXUtilities

EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXUtilitiesInterface)];
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (nullable NSDictionary *)launchOptions
{
  id<EXUtilService> utilService = [_moduleRegistry getSingletonModuleForName:@"Util"];
  return [utilService launchOptions];
}

- (UIViewController *)currentViewController
{
  id<EXUtilService> utilService = [_moduleRegistry getSingletonModuleForName:@"Util"];

  if (utilService != nil) {
    return [utilService currentViewController];
  }

  UIViewController *controller = [[[UIApplication sharedApplication] keyWindow] rootViewController];
  UIViewController *presentedController = controller.presentedViewController;
  
  while (presentedController && ![presentedController isBeingDismissed]) {
    controller = presentedController;
    presentedController = controller.presentedViewController;
  }
  return controller;
}

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

// Copied from RN
+ (BOOL)isMainQueue
{
  static void *mainQueueKey = &mainQueueKey;
  static dispatch_once_t onceToken;
  
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(dispatch_get_main_queue(),
                                mainQueueKey, mainQueueKey, NULL);
  });
  
  return dispatch_get_specific(mainQueueKey) == mainQueueKey;
}

// Copied from RN
+ (void)unsafeExecuteOnMainQueueOnceSync:(dispatch_once_t *)onceToken block:(dispatch_block_t)block
{
  // The solution was borrowed from a post by Ben Alpert:
  // https://benalpert.com/2014/04/02/dispatch-once-initialization-on-the-main-thread.html
  // See also: https://www.mikeash.com/pyblog/friday-qa-2014-06-06-secrets-of-dispatch_once.html
  if ([self isMainQueue]) {
    dispatch_once(onceToken, block);
  } else {
    if (DISPATCH_EXPECT(*onceToken == 0L, NO)) {
      dispatch_sync(dispatch_get_main_queue(), ^{
        dispatch_once(onceToken, block);
      });
    }
  }
}

// Copied from RN
+ (CGFloat)screenScale
{
  static dispatch_once_t onceToken;
  static CGFloat scale;
  
  [self unsafeExecuteOnMainQueueOnceSync:&onceToken block:^{
      scale = [UIScreen mainScreen].scale;
  }];
  
  return scale;
}


// Kind of copied from RN to make UIColor:(id)json work
+ (NSArray<NSNumber *> *)NSNumberArray:(id)json
{
  return json;
}

+ (NSNumber *)NSNumber:(id)json
{
  return json;
}

+ (CGFloat)CGFloat:(id)json
{
  return [[self NSNumber:json] floatValue];
}

+ (NSInteger)NSInteger:(id)json
{
  return [[self NSNumber:json] integerValue];
}

+ (NSUInteger)NSUInteger:(id)json
{
  return [[self NSNumber:json] unsignedIntegerValue];
}

// Copied from RN
+ (UIColor *)UIColor:(id)json
{
  if (!json) {
    return nil;
  }
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = [self NSNumberArray:json];
    CGFloat alpha = components.count > 3 ? [self CGFloat:components[3]] : 1.0;
    return [UIColor colorWithRed:[self CGFloat:components[0]]
                           green:[self CGFloat:components[1]]
                            blue:[self CGFloat:components[2]]
                           alpha:alpha];
  } else if ([json isKindOfClass:[NSNumber class]]) {
    NSUInteger argb = [self NSUInteger:json];
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
  } else {
    EXLogInfo(@"%@ cannot be converted to a UIColor", json);
    return nil;
  }
}

// Copied from RN
+ (NSDate *)NSDate:(id)json
{
  if ([json isKindOfClass:[NSNumber class]]) {
    return [NSDate dateWithTimeIntervalSince1970:[json doubleValue] / 1000.0];
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSDateFormatter *formatter;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      formatter = [NSDateFormatter new];
      formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ";
      formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
      formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
    });
    NSDate *date = [formatter dateFromString:json];
    if (!date) {
      EXLogError(@"JSON String '%@' could not be interpreted as a date. "
                  "Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ", json);
    }
    return date;
  } else if (json) {
    EXLogError(json, @"a date");
  }
  return nil;
}

// https://stackoverflow.com/questions/14051807/how-can-i-get-a-hex-string-from-uicolor-or-from-rgb
+ (NSString *)hexStringWithCGColor:(CGColorRef)color
{
  const CGFloat *components = CGColorGetComponents(color);
  size_t count = CGColorGetNumberOfComponents(color);

  if (count == 2) {
    return [NSString stringWithFormat:@"#%02lX%02lX%02lX",
            lroundf(components[0] * 255.0),
            lroundf(components[0] * 255.0),
            lroundf(components[0] * 255.0)];
  } else {
    return [NSString stringWithFormat:@"#%02lX%02lX%02lX",
            lroundf(components[0] * 255.0),
            lroundf(components[1] * 255.0),
            lroundf(components[2] * 255.0)];
  }
}

+ (BOOL)catchException:(void(^)(void))tryBlock error:(__autoreleasing NSError **)error
{
  @try {
    tryBlock();
    return YES;
  }
  @catch (NSException *exception) {
    *error = [[NSError alloc] initWithDomain:exception.name code:0 userInfo:exception.userInfo];
    return NO;
  }
}

@end

UIApplication * EXSharedApplication(void)
{
  if ([[[[NSBundle mainBundle] bundlePath] pathExtension] isEqualToString:@"appex"]) {
    return nil;
  }
  return [[UIApplication class] performSelector:@selector(sharedApplication)];
}

NSError *EXErrorWithMessage(NSString *message)
{
  NSDictionary<NSString *, id> *errorInfo = @{NSLocalizedDescriptionKey: message};
  return [[NSError alloc] initWithDomain:@"EXModulesErrorDomain" code:0 userInfo:errorInfo];
}
