//
//  ABI30_0_0AIRGoogleMapCallout.h
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#import <UIKit/UIKit.h>
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>

@interface ABI30_0_0AIRGoogleMapCallout : UIView
@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onPress;
@end
