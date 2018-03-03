// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXUtil.h"
#import "EXScopedModuleRegistry.h"
#import <React/RCTUIManager.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

@interface EXUtil ()

@property (nonatomic, weak) id kernelUtilServiceDelegate;

@end

@implementation EXUtil

@synthesize bridge = _bridge;

// delegate to kernel linking manager because our only kernel work (right now)
// is refreshing the foreground task.
EX_EXPORT_SCOPED_MODULE(ExponentUtil, KernelLinkingManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelUtilServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

RCT_EXPORT_METHOD(reload)
{
  [_kernelUtilServiceDelegate utilModuleDidSelectReload:self];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
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

+ (UIColor *)colorWithRGB:(unsigned int)rgbValue
{
  return [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0
                         green:((float)((rgbValue & 0xFF00) >> 8))/255.0
                          blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0];
}

+ (UIColor *)colorWithHexString:(NSString *)hexString
{
  if (!hexString || hexString.length != 7 || [hexString characterAtIndex:0] != '#') {
    return nil;
  }
  hexString = [hexString substringWithRange:NSMakeRange(1, 6)];
  NSScanner *scanner = [NSScanner scannerWithString:hexString];
  unsigned int hex;
  if ([scanner scanHexInt:&hex]) {
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = (hex) & 0xFF;
    
    return [UIColor colorWithRed:r / 255.0f
                           green:g / 255.0f
                            blue:b / 255.0f
                           alpha:1.0f];
  }
  return nil;
}

@end
