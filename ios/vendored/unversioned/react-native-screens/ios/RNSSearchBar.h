#import <UIKit/UIKit.h>

#ifdef RN_FABRIC_ENABLED
#import <React/RCTViewComponentView.h>
#endif

#import <React/RCTBridge.h>
#import <React/RCTComponent.h>
#import <React/RCTViewManager.h>

@interface RNSSearchBar :
#ifdef RN_FABRIC_ENABLED
    RCTViewComponentView <UISearchBarDelegate>
#else
    UIView <UISearchBarDelegate>
#endif

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;

#ifdef RN_FABRIC_ENABLED
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
