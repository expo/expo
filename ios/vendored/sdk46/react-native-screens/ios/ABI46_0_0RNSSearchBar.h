#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTViewComponentView.h>
#endif

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTComponent.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

@interface ABI46_0_0RNSSearchBar :
#ifdef RN_FABRIC_ENABLED
    ABI46_0_0RCTViewComponentView <UISearchBarDelegate>
#else
    UIView <UISearchBarDelegate>
#endif

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, copy) ABI46_0_0RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) ABI46_0_0RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) ABI46_0_0RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) ABI46_0_0RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) ABI46_0_0RCTBubblingEventBlock onBlur;
#endif

@end

@interface ABI46_0_0RNSSearchBarManager : ABI46_0_0RCTViewManager

@end
