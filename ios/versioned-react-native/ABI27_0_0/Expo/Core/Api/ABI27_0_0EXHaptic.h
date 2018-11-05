//
//  ABI27_0_0EXHaptic.h
//  Exponent
//
//  Created by Evan Bacon on 2/23/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <UIKit/UIKit.h>

#if !TARGET_OS_TV
@interface ABI27_0_0RCTConvert (UINotificationFeedback)

+ (UINotificationFeedbackType)UINotificationFeedbackType:(id)json;

@end

@interface ABI27_0_0RCTConvert (UIImpactFeedback)

+ (UIImpactFeedbackStyle)UIImpactFeedbackStyle:(id)json;

@end

#endif

@interface ABI27_0_0EXHaptic : NSObject <ABI27_0_0RCTBridgeModule>

@end


