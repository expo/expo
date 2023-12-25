//
//  AIRMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#import <UIKit/UIKit.h>
#import <React/RCTView.h>

@interface AIRMapCalloutSubview : UIView
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@end

