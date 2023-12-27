/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>
#import <UIKit/UIKit.h>

@protocol ABI43_0_0RCTLocalizationProtocol <NSObject>

/*
 Call for other apps to use their own translation functions
 */
- (NSString *)localizedString:(NSString *)oldString withDescription:(NSString *)description;

@end

/*
 * It allows to set delegate for ABI43_0_0RCTLocalizationProvider so that we could ask APPs to do translations.
 * It's an experimental feature.
 */
ABI43_0_0RCT_EXTERN void setLocalizationDelegate(id<ABI43_0_0RCTLocalizationProtocol> delegate);

/*
 * It allows apps to provide their translated language pack in case the cannot do translation ABI43_0_0Reactively.
 * It's an experimental feature.
 */
ABI43_0_0RCT_EXTERN void setLocalizationLanguagePack(NSDictionary<NSString *, NSString *> *pack);

@interface ABI43_0_0RCTLocalizationProvider : NSObject

+ (NSString *)ABI43_0_0RCTLocalizedString:(NSString *)oldString withDescription:(NSString *)description;

@end
