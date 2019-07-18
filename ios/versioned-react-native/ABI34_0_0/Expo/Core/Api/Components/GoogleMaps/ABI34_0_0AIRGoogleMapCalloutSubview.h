//
//  ABI34_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>

@interface ABI34_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI34_0_0RCTBubblingEventBlock onPress;
@end

#endif
