#import <UIKit/UIKit.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#import <react/renderer/components/rnscreens/ABI49_0_0RCTComponentViewHelpers.h>
#endif

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

@interface ABI49_0_0RNSSearchBar :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView <UISearchBarDelegate, ABI49_0_0RCTRNSSearchBarViewProtocol>
#else
    UIView <UISearchBarDelegate>
#endif

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onBlur;
#endif

@end

@interface ABI49_0_0RNSSearchBarManager : ABI49_0_0RCTViewManager

@end
