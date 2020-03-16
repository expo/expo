#import "ABI37_0_0RNCAppearance.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>

NSString *const ABI37_0_0RNCAppearanceColorSchemeLight = @"light";
NSString *const ABI37_0_0RNCAppearanceColorSchemeDark = @"dark";
NSString *const ABI37_0_0RNCAppearanceColorSchemeNoPreference = @"no-preference";

static NSString *ABI37_0_0RNCColorSchemePreference(UITraitCollection *traitCollection)
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    static NSDictionary *appearances;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
      appearances = @{
                      @(UIUserInterfaceStyleLight): ABI37_0_0RNCAppearanceColorSchemeLight,
                      @(UIUserInterfaceStyleDark): ABI37_0_0RNCAppearanceColorSchemeDark,
                      @(UIUserInterfaceStyleUnspecified): ABI37_0_0RNCAppearanceColorSchemeNoPreference
                      };
    });

    traitCollection = traitCollection ?: [UITraitCollection currentTraitCollection];
    return appearances[@(traitCollection.userInterfaceStyle)] ?: ABI37_0_0RNCAppearanceColorSchemeNoPreference;
  }
#endif

  return ABI37_0_0RNCAppearanceColorSchemeNoPreference;
}

@implementation ABI37_0_0RNCAppearance

ABI37_0_0RCT_EXPORT_MODULE();

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
            @{ @"colorScheme": ABI37_0_0RNCColorSchemePreference(nil) }
    };
}

- (void)appearanceChanged:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
  UITraitCollection *traitCollection = nil;
  if (userInfo) {
    traitCollection = userInfo[@"traitCollection"];
  }
  [self sendEventWithName:@"appearanceChanged" body:@{@"colorScheme": ABI37_0_0RNCColorSchemePreference(traitCollection)}];
}

#pragma mark - ABI37_0_0RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"appearanceChanged"];
}

- (void)startObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appearanceChanged:)
                                                 name:ABI37_0_0RNCUserInterfaceStyleDidChangeNotification
                                               object:self.bridge];
  }
}

- (void)stopObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:ABI37_0_0RNCUserInterfaceStyleDidChangeNotification
                                                  object:self.bridge];
  }
}

@end
