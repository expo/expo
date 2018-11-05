//
//  ABI29_0_0AIRGoogleMapCallout.h
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import <UIKit/UIKit.h>
#import <ReactABI29_0_0/ABI29_0_0RCTView.h>

@interface ABI29_0_0AIRGoogleMapCallout : UIView
@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onPress;
@end
