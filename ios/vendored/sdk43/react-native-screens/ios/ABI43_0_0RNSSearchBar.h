#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTComponent.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

@interface ABI43_0_0RNSSearchBar : UIView <UISearchBarDelegate>

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onBlur;

@end

@interface ABI43_0_0RNSSearchBarManager : ABI43_0_0RCTViewManager

@end
