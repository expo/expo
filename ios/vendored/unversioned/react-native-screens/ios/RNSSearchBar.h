#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTComponent.h>
#import <React/RCTViewManager.h>

@interface RNSSearchBar : UIView <UISearchBarDelegate>

@property (nonatomic) BOOL hideWhenScrolling;

@property (nonatomic, retain) UISearchController *controller;
@property (nonatomic, copy) RCTBubblingEventBlock onChangeText;
@property (nonatomic, copy) RCTBubblingEventBlock onCancelButtonPress;
@property (nonatomic, copy) RCTBubblingEventBlock onSearchButtonPress;
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;

@end

@interface RNSSearchBarManager : RCTViewManager

@end
