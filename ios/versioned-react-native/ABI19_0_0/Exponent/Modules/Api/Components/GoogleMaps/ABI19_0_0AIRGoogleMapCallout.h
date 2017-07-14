//
//  ABI19_0_0AIRGoogleMapCallout.h
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import <UIKit/UIKit.h>
#import <ReactABI19_0_0/ABI19_0_0RCTView.h>

@interface ABI19_0_0AIRGoogleMapCallout : UIView
@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onPress;
@end
