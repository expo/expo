//
//  EXHaptic.h
//  Exponent
//
//  Created by Evan Bacon on 2/23/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>

#if !TARGET_OS_TV
@interface RCTConvert (UINotificationFeedback)

+ (UINotificationFeedbackType)UINotificationFeedbackType:(id)json;

@end

@interface RCTConvert (UIImpactFeedback)

+ (UIImpactFeedbackStyle)UIImpactFeedbackStyle:(id)json;

@end

#endif

@interface EXHaptic : NSObject <RCTBridgeModule>

@end


