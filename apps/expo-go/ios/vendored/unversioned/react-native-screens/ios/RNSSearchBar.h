#import <UIKit/UIKit.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/rnscreens/RCTComponentViewHelpers.h>
#endif

#import <React/RCTBridge.h>
#import <React/RCTComponent.h>
#import <React/RCTViewManager.h>
#import "RNSEnums.h"

@interface RNSSearchBar :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView <UISearchBarDelegate, RCTRNSSearchBarViewProtocol>
#else
    UIView <UISearchBarDelegate>
#endif

@property (nonatomic) BOOL hideWhenScrolling;
@property (nonatomic) RNSSearchBarPlacement placement;
@property (nonatomic, retain) UISearchController *controller;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_16_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_16_0 && !TARGET_OS_TV
- (UINavigationItemSearchBarPlacement)placementAsUINavigationItemSearchBarPlacement API_AVAILABLE(ios(16.0))
    API_UNAVAILABLE(tvos, watchos);
#endif // Check for iOS >= 16 && !TARGET_OS_TV

#ifdef RCT_NEW_ARCH_ENABLED
#else
@property (nonatomic, copy) RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;
#endif

@end

@interface RNSSearchBarManager : RCTViewManager

@end
