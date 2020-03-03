#import "RNCAppearance.h"

#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>

NSString *const RNCAppearanceColorSchemeLight = @"light";
NSString *const RNCAppearanceColorSchemeDark = @"dark";
NSString *const RNCAppearanceColorSchemeNoPreference = @"no-preference";

static NSString *RNCColorSchemePreference(UITraitCollection *traitCollection)
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    static NSDictionary *appearances;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
      appearances = @{
                      @(UIUserInterfaceStyleLight): RNCAppearanceColorSchemeLight,
                      @(UIUserInterfaceStyleDark): RNCAppearanceColorSchemeDark,
                      @(UIUserInterfaceStyleUnspecified): RNCAppearanceColorSchemeNoPreference
                      };
    });

    traitCollection = traitCollection ?: [UITraitCollection currentTraitCollection];
    return appearances[@(traitCollection.userInterfaceStyle)] ?: RNCAppearanceColorSchemeNoPreference;
  }
#endif

  return RNCAppearanceColorSchemeNoPreference;
}

@implementation RNCAppearance

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
    return @{
        @"initialPreferences":
            @{ @"colorScheme": RNCColorSchemePreference(nil) }
    };
}

- (void)appearanceChanged:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
  UITraitCollection *traitCollection = nil;
  if (userInfo) {
    traitCollection = userInfo[@"traitCollection"];
  }
  [self sendEventWithName:@"appearanceChanged" body:@{@"colorScheme": RNCColorSchemePreference(traitCollection)}];
}

#pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"appearanceChanged"];
}

- (void)startObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appearanceChanged:)
                                                 name:RNCUserInterfaceStyleDidChangeNotification
                                               object:self.bridge];
  }
}

- (void)stopObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:RNCUserInterfaceStyleDidChangeNotification
                                                  object:self.bridge];
  }
}

@end
