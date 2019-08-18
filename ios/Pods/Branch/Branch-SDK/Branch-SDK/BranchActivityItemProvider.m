//
//  BranchActivityItemProvider.m
//  Branch-TestBed
//
//  Created by Scott Hasbrouck on 1/28/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchActivityItemProvider.h"
#import "Branch.h"
#import "BranchConstants.h"
#import "BNCSystemObserver.h"
#import "BNCDeviceInfo.h"

@interface BranchActivityItemProvider ()

@property (strong, nonatomic) NSDictionary *params;
@property (strong, nonatomic) NSArray *tags;
@property (strong, nonatomic) NSString *feature;
@property (strong, nonatomic) NSString *stage;
@property (strong, nonatomic) NSString *campaign;
@property (strong, nonatomic) NSString *alias;
@property (strong, nonatomic) NSString *userAgentString;
@property (weak, nonatomic) id <BranchActivityItemProviderDelegate> delegate;

@end

@implementation BranchActivityItemProvider

- (id)initWithParams:(NSDictionary *)params
             andTags:(NSArray *)tags
          andFeature:(NSString *)feature
            andStage:(NSString *)stage
            andAlias:(NSString *)alias {
    return [self initWithParams:params tags:tags feature:feature stage:stage campaign:nil alias:alias delegate:nil];
}

- (id)initWithParams:(NSDictionary *)params
                tags:(NSArray *)tags
             feature:(NSString *)feature
               stage:(NSString *)stage
            campaign:(NSString *)campaign
               alias:(NSString *)alias
            delegate:(id <BranchActivityItemProviderDelegate>)delegate {

    NSString *url =
        [[Branch getInstance]
         getLongURLWithParams:params
         andChannel:nil
         andTags:tags
         andFeature:feature
         andStage:stage
         andAlias:alias];

    if (self.returnURL) {
        if ((self = [super initWithPlaceholderItem:[NSURL URLWithString:url]])) {
            _params = params;
            _tags = tags;
            _feature = feature;
            _stage = stage;
            _campaign = campaign;
            _alias = alias;
            _userAgentString = [BNCDeviceInfo userAgentString];
            _delegate = delegate;
        }
    } else {
        if ((self = [super initWithPlaceholderItem:url])) {
            _params = params;
            _tags = tags;
            _feature = feature;
            _stage = stage;
            _campaign = campaign;
            _alias = alias;
            _userAgentString = [BNCDeviceInfo userAgentString];
            _delegate = delegate;
        }
    }
    return self;
}

- (BOOL) returnURL {
    BOOL returnURL = YES;
    if ([UIDevice currentDevice].systemVersion.doubleValue >= 11.0 &&
        [UIDevice currentDevice].systemVersion.doubleValue  < 11.2 &&
        [self.activityType isEqualToString:UIActivityTypeCopyToPasteboard]) {
        returnURL = NO;
    }
    return returnURL;
}

- (id)item {
    NSString *channel = [BranchActivityItemProvider humanReadableChannelWithActivityType:self.activityType];


    // Allow for overrides specific to channel
    NSDictionary *params = [self paramsForChannel:channel];
    NSArray *tags = [self tagsForChannel:channel];
    NSString *feature = [self featureForChannel:channel];
    NSString *stage = [self stageForChannel:channel];
    NSString *campaign = [self campaignForChannel:channel];
    NSString *alias = [self aliasForChannel:channel];

    // Allow the channel param to be overridden, perhaps they want "fb" instead of "facebook"
    if ([self.delegate respondsToSelector:@selector(activityItemOverrideChannelForChannel:)]) {
        channel = [self.delegate activityItemOverrideChannelForChannel:channel];
    }
    
    // Because Facebook et al immediately scrape URLs, we add an additional parameter to the
    // existing list, telling the backend to ignore the first click
    NSArray *scrapers = @[
        @"Facebook",
        @"Twitter",
        @"Slack",
        @"Apple Notes",
        @"Skype",
        @"SMS"
    ];
    for (NSString *scraper in scrapers) {
        if ([channel isEqualToString:scraper]) {
            NSURL *URL = [NSURL URLWithString:[[Branch getInstance]
                getShortURLWithParams:params
                andTags:tags
                andChannel:channel
                andFeature:feature
                andStage:stage
                andCampaign:campaign
                andAlias:alias
                ignoreUAString:self.userAgentString
                forceLinkCreation:YES]];
            return (self.returnURL) ? URL : URL.absoluteString;
        }
    }

    // Wrap the link in HTML content
    if (self.activityType == UIActivityTypeMail &&
        [params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_HEADER] &&
        [params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_FOOTER]) {
        NSURL *link = [NSURL URLWithString:[[Branch getInstance]
            getShortURLWithParams:params
            andTags:tags
            andChannel:channel
            andFeature:feature
            andStage:stage
            andCampaign:campaign
            andAlias:alias
            ignoreUAString:nil
            forceLinkCreation:YES]];
        NSString *emailLink;
        if ([params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_LINK_TEXT]) {
            emailLink = [NSString stringWithFormat:@"<a href=\"%@\">%@</a>",
                link, [params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_LINK_TEXT]];
        } else {
            emailLink = link.absoluteString;
        }

        return [NSString stringWithFormat:@"<html>%@%@%@</html>",
            [params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_HEADER],
            emailLink,
            [params objectForKey:BRANCH_LINK_DATA_KEY_EMAIL_HTML_FOOTER]];
    }

    NSURL *URL =
        [NSURL URLWithString:[[Branch getInstance]
            getShortURLWithParams:params
            andTags:tags
            andChannel:channel
            andFeature:feature
            andStage:stage
            andCampaign:campaign
            andAlias:alias
            ignoreUAString:nil
            forceLinkCreation:YES]];
    return (self.returnURL) ? URL : URL.absoluteString;
}

#pragma mark - Internals

+ (NSString *)humanReadableChannelWithActivityType:(NSString *)activityString {
    NSDictionary *channelMappings = [[NSDictionary alloc] initWithObjectsAndKeys:
        @"Pasteboard",  UIActivityTypeCopyToPasteboard,
        @"Email",       UIActivityTypeMail,
        @"SMS",         UIActivityTypeMessage,
        @"Facebook",    UIActivityTypePostToFacebook,
        @"Twitter",     UIActivityTypePostToTwitter,
        @"Weibo",       UIActivityTypePostToWeibo,
        @"Reading List",UIActivityTypeAddToReadingList,
        @"Airdrop",     UIActivityTypeAirDrop,
        @"flickr",      UIActivityTypePostToFlickr,
        @"Tencent Weibo", UIActivityTypePostToTencentWeibo,
        @"Vimeo",       UIActivityTypePostToVimeo,
        @"Apple Notes", @"com.apple.mobilenotes.SharingExtension",
        @"Slack",       @"com.tinyspeck.chatlyio.share",
        @"WhatsApp",    @"net.whatsapp.WhatsApp.ShareExtension",
        @"WeChat",      @"com.tencent.xin.sharetimeline",
        @"LINE",        @"jp.naver.line.Share",
		@"Pinterest",   @"pinterest.ShareExtension",
        @"Skype",       @"com.skype.skype.sharingextension",
        @"Apple Reminders", @"com.apple.reminders.RemindersEditorExtension",

        //  Keys for older app versions --

        @"Facebook",    @"com.facebook.Facebook.ShareExtension",
        @"Twitter",     @"com.atebits.Tweetie2.ShareExtension",

        nil
    ];
    // Set to a more human readable string if we can identify it.
    if (activityString) {
        NSString*humanString = channelMappings[activityString];
        if (humanString) activityString = humanString;
    }
    return activityString;
}

- (NSDictionary *)paramsForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemParamsForChannel:)])
        ? [self.delegate activityItemParamsForChannel:channel]
        : self.params;
}

- (NSArray *)tagsForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemTagsForChannel:)])
        ? [self.delegate activityItemTagsForChannel:channel]
        : self.tags;
}

- (NSString *)featureForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemFeatureForChannel:)])
        ? [self.delegate activityItemFeatureForChannel:channel]
        : self.feature;
}

- (NSString *)stageForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemStageForChannel:)])
        ? [self.delegate activityItemStageForChannel:channel]
        : self.stage;
}

- (NSString *)campaignForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemCampaignForChannel:)])
        ? [self.delegate activityItemCampaignForChannel:channel]
        : self.campaign;
}

- (NSString *)aliasForChannel:(NSString *)channel {
    return ([self.delegate respondsToSelector:@selector(activityItemAliasForChannel:)])
        ? [self.delegate activityItemAliasForChannel:channel]
        : self.alias;
}

@end
