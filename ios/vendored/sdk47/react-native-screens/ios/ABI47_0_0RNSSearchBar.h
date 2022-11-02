#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#endif

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

@interface ABI47_0_0RNSSearchBar :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView <UISearchBarDelegate>
#else
    UIView <UISearchBarDelegate>
#endif

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onBlur;
#endif

@end

@interface ABI47_0_0RNSSearchBarManager : ABI47_0_0RCTViewManager

@end
