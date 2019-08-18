//
//  BNCFabricAnswers.m
//  Branch-TestBed
//
//  Created by Ahmed Nawar on 6/2/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "Branch.h"
#import "BNCFabricAnswers.h"
#import "BNCPreferenceHelper.h"
#import "../Fabric/Answers.h"
#import "../Fabric/Fabric+FABKits.h"

@implementation BNCFabricAnswers

+ (void)sendEventWithName:(NSString *)name andAttributes:(NSDictionary *)attributes {
    ANSLogCustomEvent(name, [self prepareBranchDataForAnswers:attributes]);
}

+ (NSDictionary *)prepareBranchDataForAnswers:(NSDictionary *)dictionary {
    NSMutableDictionary *temp = [[NSMutableDictionary alloc] init];
    
    for (NSString *key in dictionary.allKeys) {
        if ([key hasPrefix:@"+"] || ([key hasPrefix:@"$"] && ![key isEqualToString:@"$identity_id"])) {
            // ignore because this data is not found on the ShareSheet
            continue;
        } else if ([dictionary[key] isKindOfClass:[NSArray class]]) {
            // flatten arrays, special treatement for ~tags
            NSString *aKey;
            if ([key hasPrefix:@"~"])
                aKey = [key substringFromIndex:1];
            else
                aKey = key;
            NSArray *valuesArray = dictionary[key];
            for (NSUInteger i = 0; i < valuesArray.count; ++i) {
                temp[[NSString stringWithFormat:@"%@.%lu", aKey, (unsigned long)i]] = valuesArray[i];
            }
        } else if ([key hasPrefix:@"~"]) {
            // strip tildes ~
            temp[[key substringFromIndex:1]] = dictionary[key];
        } else if ([key isEqualToString:@"$identity_id"]) {
            temp[@"referring_branch_identity"] = dictionary[key];
        }
    }

    [[BNCPreferenceHelper preferenceHelper] synchronize];
    NSString *identity = [[BNCPreferenceHelper preferenceHelper].identityID copy];
    if (identity) {
        temp[@"branch_identity"] = identity;
    }
    
    return temp;
}

+ (NSDictionary*) branchConfigurationDictionary {
    Class fabric = NSClassFromString(@"Fabric");
    if ([fabric respondsToSelector:@selector(configurationDictionaryForKitClass:)]) {

        // The name of this key was specified in the account-creation API integration
        NSString * const BNC_BRANCH_FABRIC_APP_KEY_KEY = @"branch_key";

        NSDictionary *configDictionary = [fabric configurationDictionaryForKitClass:[Branch class]];
        NSDictionary *dictionary = [configDictionary objectForKey:BNC_BRANCH_FABRIC_APP_KEY_KEY];

        return dictionary;
    }
    return nil;
}

@end
