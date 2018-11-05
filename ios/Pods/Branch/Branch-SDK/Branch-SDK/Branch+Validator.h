//
//  Branch+Validator.h
//  Branch
//
//  Created by agrim on 12/18/17.
//  Copyright © 2017 Branch, Inc. All rights reserved.
//

#import "Branch.h"

@interface Branch (Validator)
- (void) validateSDKIntegrationCore;
- (void) validateDeeplinkRouting:(NSDictionary *)params;
+ (NSString *) returnNonUniversalLink:(NSString *) referringLink;
@end

void BNCForceBranchValidatorCategoryToLoad(void);
