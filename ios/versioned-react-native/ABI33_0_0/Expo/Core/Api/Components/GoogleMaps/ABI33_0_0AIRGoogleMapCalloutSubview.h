//
//  ABI33_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@interface ABI33_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI33_0_0RCTBubblingEventBlock onPress;
@end

#endif
