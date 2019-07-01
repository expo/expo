//
//  Branch+Validator.m
//  Branch
//
//  Created by agrim on 12/18/17.
//  Copyright © 2017 Branch, Inc. All rights reserved.
//

#import "Branch+Validator.h"
#import "BNCSystemObserver.h"
#import "BranchConstants.h"
#import "BNCApplication.h"
#import "BNCEncodingUtils.h"

void BNCForceBranchValidatorCategoryToLoad(void) {
    // Empty body but forces loader to load the category.
}

static inline void BNCPerformBlockOnMainThreadAsync(dispatch_block_t block) {
    dispatch_async(dispatch_get_main_queue(), block);
}

static inline dispatch_time_t BNCDispatchTimeFromSeconds(NSTimeInterval seconds)    {
    return dispatch_time(DISPATCH_TIME_NOW, seconds * NSEC_PER_SEC);
}

static inline void BNCAfterSecondsPerformBlockOnMainThread(NSTimeInterval seconds, dispatch_block_t block) {
    dispatch_after(BNCDispatchTimeFromSeconds(seconds), dispatch_get_main_queue(), block);
}

#pragma mark - Branch (Validator)

@implementation Branch (Validator)

- (void)validateSDKIntegrationCore {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        [self startValidation];
    });
}

- (void) startValidation {
    BNCPreferenceHelper *preferenceHelper = [BNCPreferenceHelper preferenceHelper];
    NSString *endpoint =
        [BRANCH_REQUEST_ENDPOINT_APP_LINK_SETTINGS stringByAppendingPathComponent:preferenceHelper.lastRunBranchKey];
    [[[BNCServerInterface alloc] init]
        getRequest:nil
        url:[preferenceHelper getAPIURL:endpoint]
        key:nil
        callback:^ (BNCServerResponse *response, NSError *error) {
            if (error) {
                [self showAlertWithTitle:@"Error" message:error.localizedDescription];
            } else {
                [self validateIntegrationWithServerResponse:response];
            }
        }];
}

- (void) validateIntegrationWithServerResponse:(BNCServerResponse*)response {
    NSString*passString = @"PASS";
    NSString*errorString = @"ERROR";

    // Decode the server message:
    NSString*serverUriScheme    = BNCStringFromWireFormat(response.data[@"ios_uri_scheme"]) ?: @"";
    NSString*serverBundleID     = BNCStringFromWireFormat(response.data[@"ios_bundle_id"]) ?: @"";
    NSString*serverTeamID       = BNCStringFromWireFormat(response.data[@"ios_team_id"]) ?: @"";

    // Verify:
    NSLog(@"** Initiating Branch integration verification **");
    NSLog(@"-------------------------------------------------");

    NSLog(@"------ Checking for URI scheme correctness ------");
    NSString *clientUriScheme = [NSString stringWithFormat:@"%@%@", [BNCSystemObserver getDefaultUriScheme], @"://"];
    NSString *uriScheme = [serverUriScheme isEqualToString:clientUriScheme] ? passString : errorString;
    NSString *uriSchemeMessage =
        [NSString stringWithFormat:@"%@: Dashboard Link Settings page '%@' compared to client side '%@'",
            uriScheme, serverUriScheme, clientUriScheme];
    NSLog(@"%@",uriSchemeMessage);
    NSLog(@"-------------------------------------------------");

    NSLog(@"-- Checking for bundle identifier correctness ---");
    NSString *clientBundleIdentifier = [[NSBundle mainBundle] bundleIdentifier] ?: @"";
    NSString *bundleIdentifier = [serverBundleID isEqualToString:clientBundleIdentifier] ? passString : errorString;
    NSString *bundleIdentifierMessage =
        [NSString stringWithFormat:@"%@: Dashboard Link Settings page '%@' compared to client side '%@'",
            bundleIdentifier, serverBundleID, clientBundleIdentifier];
    NSLog(@"%@",bundleIdentifierMessage);
    NSLog(@"-------------------------------------------------");

    NSLog(@"----- Checking for iOS Team ID correctness ------");
    NSString *clientTeamId = [BNCApplication currentApplication].teamID ?: @"";
    NSString *teamID = [serverTeamID isEqualToString:clientTeamId] ? passString : errorString;
    NSString *teamIDMessage =
        [NSString stringWithFormat:@"%@: Dashboard Link Settings page '%@' compared to client side '%@'",
            teamID, serverTeamID, clientTeamId];
    NSLog(@"%@",teamIDMessage);
    NSLog(@"-------------------------------------------------");

    if ([teamID isEqualToString:errorString] ||
        [bundleIdentifier isEqualToString:errorString] ||
        [uriScheme isEqualToString:errorString]) {
        NSLog(@"%@: server side '%@' compared to client side '%@'.", errorString, serverTeamID, clientTeamId);
        NSLog(@"To fix your Dashboard settings head over to https://branch.app.link/link-settings-page");
        NSLog(@"If you see a null value on the client side, please temporarily add the following key-value pair to your plist: \n\t<key>AppIdentifierPrefix</key><string>$(AppIdentifierPrefix)</string>\n-> then re-run this test.");
        NSLog(@"-------------------------------------------------");
    }

    NSLog(@"-------------------------------------------------------------------------------------------------------------------");
    NSLog(@"-----To test your deeplink routing append ?bnc_validate=true to any branch link and click it on your mobile device-----");
    NSLog(@"-------------------------------------------------------------------------------------------------------------------");

    BOOL testsFailed = NO;
    NSString *kPassMark = @"✅\t";
    NSString *kFailMark = @"❌\t";

    // Build an alert string:
    NSString *alertString = @"\n";
    if (serverUriScheme.length && [serverUriScheme isEqualToString:clientUriScheme]) {
        alertString = [alertString stringByAppendingFormat:@"%@URI Scheme matches:\n\t'%@'\n",
            kPassMark,  serverUriScheme];
    } else {
        testsFailed = YES;
        alertString = [alertString stringByAppendingFormat:@"%@URI Scheme mismatch:\n\t'%@'\n",
            kFailMark,  serverUriScheme];
    }

    if ([serverBundleID isEqualToString:clientBundleIdentifier]) {
        alertString = [alertString stringByAppendingFormat:@"%@App Bundle ID matches:\n\t'%@'\n",
            kPassMark,  serverBundleID];
    } else {
        testsFailed = YES;
        alertString = [alertString stringByAppendingFormat:@"%@App Bundle ID mismatch:\n\t'%@'\n",
            kFailMark,  serverBundleID];
    }

    if ([serverTeamID isEqualToString:clientTeamId]) {
        alertString = [alertString stringByAppendingFormat:@"%@Team ID matches:\n\t'%@'\n",
            kPassMark,  serverTeamID];
    } else {
        testsFailed = YES;
        alertString = [alertString stringByAppendingFormat:@"%@Team ID mismatch:\n\t'%@'\n",
            kFailMark,  serverTeamID];
    }

    if (testsFailed) {
        alertString = [alertString stringByAppendingString:@"\nFailed!\nCheck the log for details."];
    } else {
        alertString = [alertString stringByAppendingString:@"\nPassed!"];
    }

    NSMutableParagraphStyle *ps = [NSMutableParagraphStyle new];
    ps.alignment = NSTextAlignmentLeft;
    NSAttributedString *styledAlertString =
        [[NSAttributedString alloc]
            initWithString:alertString
            attributes:@{
                NSParagraphStyleAttributeName:  ps
            }];

    BNCPerformBlockOnMainThreadAsync(^{
        UIAlertController *alertController =
            [UIAlertController alertControllerWithTitle:@"Branch Integration"
                message:alertString
                preferredStyle:UIAlertControllerStyleAlert];
        if (testsFailed) {
            [alertController
                addAction:[UIAlertAction actionWithTitle:@"Bummer"
                style:UIAlertActionStyleDefault
                handler:nil]];
        } else {
            [alertController
                addAction:[UIAlertAction actionWithTitle:@"Next Step"
                style:UIAlertActionStyleDefault
                handler:^ (UIAlertAction *action) { [self showNextStep]; }]];
        }
        [alertController setValue:styledAlertString forKey:@"attributedMessage"];
        [[UIViewController bnc_currentViewController]
            presentViewController:alertController
            animated:YES
            completion:nil];
    });
}

- (void) showNextStep {
    NSString *message =
        @"\nGreat! Remove the 'validateSDKIntegration' line in your app.\n\n"
         "Next check your deep link routing.\n\n"
         "Append '?bnc_validate=true' to any of your app's Branch links and "
         "click on it on your mobile device (not the Simulator!) to start the test.\n\n"
         "For instance, to validate a link like:\n"
         "https://<yourapp>.app.link/NdJ6nFzRbK\n\n"
         "click on:\n"
         "https://<yourapp>.app.link/NdJ6nFzRbK?bnc_validate=true";
    NSLog(
        @"\n----------------------------------------------------------------------------"
         "\nBranch Integration Next Steps\n"
         "\n"
         "%@"
         "\n----------------------------------------------------------------------------", message);
    [self showAlertWithTitle:@"Next Step" message:message];
}

- (void) showAlertWithTitle:(NSString*)title message:(NSString*)message {
    BNCPerformBlockOnMainThreadAsync(^{
        UIAlertController *alertController =
            [UIAlertController alertControllerWithTitle:title
                message:message
                preferredStyle:UIAlertControllerStyleAlert];
        [alertController
            addAction:[UIAlertAction actionWithTitle:@"OK"
            style:UIAlertActionStyleDefault handler:nil]];
        [[UIViewController bnc_currentViewController]
            presentViewController:alertController
            animated:YES
            completion:nil];
    });
}

- (void)returnToBrowserBasedOnReferringLink:(NSString *)referringLink
                                currentTest:(NSString *)currentTest
                                 newTestVal:(NSString *)val {
    // TODO: handling for missing ~referring_link
    // TODO: test with short url where, say, t1=b is set in deep link data.
    // If this logic fails then we'll need to generate a new short URL, which is sucky.
    referringLink = [self.class returnNonUniversalLink:referringLink];
    NSURLComponents *comp = [NSURLComponents componentsWithURL:[NSURL URLWithString:referringLink]
                                       resolvingAgainstBaseURL:NO]; // TODO: Check iOS 8 support
    NSArray *queryParams = [comp queryItems];
    NSMutableArray *newQueryParams = [NSMutableArray array];
    for (NSURLQueryItem *queryParam in queryParams) {
        if (![queryParam.name isEqualToString:currentTest]) {
            [newQueryParams addObject:queryParam];
        }
    }
    [newQueryParams addObject:[NSURLQueryItem queryItemWithName:currentTest value:val]];
    [newQueryParams addObject:[NSURLQueryItem queryItemWithName:@"validate" value:@"true"]];
    comp.queryItems = newQueryParams;
    
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    Class applicationClass = NSClassFromString(@"UIApplication");
    id<NSObject> sharedApplication = [applicationClass performSelector:@selector(sharedApplication)];
    SEL openURL = @selector(openURL:);
    if ([sharedApplication respondsToSelector:openURL])
        [sharedApplication performSelector:openURL withObject:comp.URL];
    #pragma clang diagnostic pop
}

- (void)validateDeeplinkRouting:(NSDictionary *)params {
    BNCAfterSecondsPerformBlockOnMainThread(0.30, ^{
        UIAlertController *alertController =
            [UIAlertController
                alertControllerWithTitle:@"Branch Deeplink Routing Support"
                message:nil
                preferredStyle:UIAlertControllerStyleAlert];

        if ([params[@"+clicked_branch_link"] isEqualToNumber:@YES]) {
            alertController.message =
                @"Good news - we got link data. Now a question for you, astute developer: "
                 "did the app deep link to the specific piece of content you expected to see?";
            // yes
            [alertController addAction:[UIAlertAction
                actionWithTitle:@"Yes" style:UIAlertActionStyleDefault
                    handler:^(UIAlertAction * _Nonnull action) {
                        [self returnToBrowserBasedOnReferringLink:params[@"~referring_link"]
                            currentTest:params[@"ct"] newTestVal:@"g"];
            }]];
            // no
            [alertController addAction:[UIAlertAction
                actionWithTitle:@"No" style:UIAlertActionStyleDestructive
                    handler:^(UIAlertAction * _Nonnull action) {
                        [self returnToBrowserBasedOnReferringLink:params[@"~referring_link"]
                            currentTest:params[@"ct"] newTestVal:@"r"];
            }]];
            // cancel
            [alertController addAction:[UIAlertAction
                actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:nil]];
        }
        else {
            alertController.message =
                @"Bummer. It seems like +clicked_branch_link is false - we didn't deep link.  "
                 "Double check that the link you're clicking has the same branch_key that is being "
                 "used in your .plist file. Return to Safari when you're ready to test again.";
            [alertController addAction:[UIAlertAction
                actionWithTitle:@"Got it" style:UIAlertActionStyleDefault handler:nil]];
        }
        [[UIViewController bnc_currentViewController]
            presentViewController:alertController animated:YES completion:nil];
    });
}

+ (NSString *) returnNonUniversalLink:(NSString *) referringLink {
    // Appending /e/ to not treat this link as a Universal link
    NSArray *lines = [referringLink componentsSeparatedByString: @"/"];
    referringLink = @"";
    for (int i = 0 ; i < [lines count]; i++) {
        if(i != 2) {
            referringLink = [referringLink stringByAppendingString:lines[i]];
            referringLink = [referringLink stringByAppendingString:@"/"];
        } else {
            referringLink = [referringLink stringByAppendingString:lines[i]];
            referringLink = [referringLink stringByAppendingString:@"/e/"];
        }
    }
    referringLink = [referringLink stringByReplacingOccurrencesOfString:@"-alternate" withString:@""];
    return referringLink;
}

@end
