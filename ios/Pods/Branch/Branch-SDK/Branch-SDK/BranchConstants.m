//
//  BranchConstants.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 6/10/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BranchConstants.h"

NSString * const BRANCH_REQUEST_KEY_BRANCH_IDENTITY = @"identity_id";
NSString * const BRANCH_REQUEST_KEY_DEVELOPER_IDENTITY = @"identity";
NSString * const BRANCH_REQUEST_KEY_DEVICE_FINGERPRINT_ID = @"device_fingerprint_id";
NSString * const BRANCH_REQUEST_KEY_SESSION_ID = @"session_id";
NSString * const BRANCH_REQUEST_KEY_ACTION = @"event";
NSString * const BRANCH_REQUEST_KEY_STATE = @"metadata";
NSString * const BRANCH_REQUEST_KEY_BUCKET = @"bucket";
NSString * const BRANCH_REQUEST_KEY_AMOUNT = @"amount";
NSString * const BRANCH_REQUEST_KEY_LENGTH = @"length";
NSString * const BRANCH_REQUEST_KEY_DIRECTION = @"direction";
NSString * const BRANCH_REQUEST_KEY_STARTING_TRANSACTION_ID = @"begin_after_id";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_USAGE_TYPE = @"calculation_type";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_REWARD_LOCATION = @"location";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_TYPE = @"type";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_CREATION_SOURCE = @"creation_source";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_PREFIX = @"prefix";
NSString * const BRANCH_REQUEST_KEY_REFERRAL_EXPIRATION = @"expiration";
NSString * const BRANCH_REQUEST_KEY_URL_SOURCE = @"source";
NSString * const BRANCH_REQUEST_KEY_URL_TAGS = @"tags";
NSString * const BRANCH_REQUEST_KEY_URL_LINK_TYPE = @"type";
NSString * const BRANCH_REQUEST_KEY_URL_ALIAS = @"alias";
NSString * const BRANCH_REQUEST_KEY_URL_CHANNEL = @"channel";
NSString * const BRANCH_REQUEST_KEY_URL_FEATURE = @"feature";
NSString * const BRANCH_REQUEST_KEY_URL_STAGE = @"stage";
NSString * const BRANCH_REQUEST_KEY_URL_CAMPAIGN = @"campaign";
NSString * const BRANCH_REQUEST_KEY_URL_DURATION = @"duration";
NSString * const BRANCH_REQUEST_KEY_URL_DATA = @"data";
NSString * const BRANCH_REQUEST_KEY_URL_IGNORE_UA_STRING = @"ignore_ua_string";
NSString * const BRANCH_REQUEST_KEY_HARDWARE_ID = @"hardware_id";
NSString * const BRANCH_REQUEST_KEY_HARDWARE_ID_TYPE = @"hardware_id_type";
NSString * const BRANCH_REQUEST_KEY_IS_HARDWARE_ID_REAL = @"is_hardware_id_real";
NSString * const BRANCH_REQUEST_KEY_IOS_VENDOR_ID = @"ios_vendor_id";
NSString * const BRANCH_REQUEST_KEY_AD_TRACKING_ENABLED = @"ad_tracking_enabled";
NSString * const BRANCH_REQUEST_KEY_DEBUG = @"debug";
NSString * const BRANCH_REQUEST_KEY_BUNDLE_ID = @"ios_bundle_id";
NSString * const BRANCH_REQUEST_KEY_TEAM_ID = @"ios_team_id";
NSString * const BRANCH_REQUEST_KEY_APP_VERSION = @"app_version";
NSString * const BRANCH_REQUEST_KEY_OS = @"os";
NSString * const BRANCH_REQUEST_KEY_OS_VERSION = @"os_version";
NSString * const BRANCH_REQUEST_KEY_URI_SCHEME = @"uri_scheme";
NSString * const BRANCH_REQUEST_KEY_LINK_IDENTIFIER = @"link_identifier";
NSString * const BRANCH_REQUEST_KEY_CHECKED_FACEBOOK_APPLINKS = @"facebook_app_link_checked";
NSString * const BRANCH_REQUEST_KEY_CHECKED_APPLE_AD_ATTRIBUTION = @"apple_ad_attribution_checked";
NSString * const BRANCH_REQUEST_KEY_SPOTLIGHT_IDENTIFIER = @"spotlight_identifier";
NSString * const BRANCH_REQUEST_KEY_UNIVERSAL_LINK_URL = @"universal_link_url";
NSString * const BRANCH_REQUEST_KEY_BRAND = @"brand";
NSString * const BRANCH_REQUEST_KEY_MODEL = @"model";
NSString * const BRANCH_REQUEST_KEY_SCREEN_WIDTH = @"screen_width";
NSString * const BRANCH_REQUEST_KEY_SCREEN_HEIGHT = @"screen_height";
NSString * const BRANCH_REQUEST_KEY_IS_SIMULATOR = @"is_simulator";
NSString * const BRANCH_REQUEST_KEY_LOG = @"log";
NSString * const BRANCH_REQUEST_KEY_INSTRUMENTATION = @"instrumentation";
NSString * const BRANCH_REQUEST_KEY_APPLE_RECEIPT = @"apple_receipt";
NSString * const BRANCH_REQUEST_KEY_APPLE_TESTFLIGHT = @"apple_testflight";

NSString * const BRANCH_REQUEST_ENDPOINT_SET_IDENTITY = @"profile";
NSString * const BRANCH_REQUEST_ENDPOINT_APP_LINK_SETTINGS = @"app-link-settings";
NSString * const BRANCH_REQUEST_ENDPOINT_LOGOUT = @"logout";
NSString * const BRANCH_REQUEST_ENDPOINT_USER_COMPLETED_ACTION = @"event";
NSString * const BRANCH_REQUEST_ENDPOINT_LOAD_REWARDS = @"credits";
NSString * const BRANCH_REQUEST_ENDPOINT_REDEEM_REWARDS = @"redeem";
NSString * const BRANCH_REQUEST_ENDPOINT_CREDIT_HISTORY = @"credithistory";
NSString * const BRANCH_REQUEST_ENDPOINT_GET_SHORT_URL = @"url";
NSString * const BRANCH_REQUEST_ENDPOINT_CLOSE = @"close";
NSString * const BRANCH_REQUEST_ENDPOINT_OPEN = @"open";
NSString * const BRANCH_REQUEST_ENDPOINT_INSTALL = @"install";
NSString * const BRANCH_REQUEST_ENDPOINT_REGISTER_VIEW = @"register-view";

NSString * const BRANCH_RESPONSE_KEY_BRANCH_IDENTITY = @"identity_id";
NSString * const BRANCH_RESPONSE_KEY_SESSION_ID = @"session_id";
NSString * const BRANCH_RESPONSE_KEY_USER_URL = @"link";
NSString * const BRANCH_RESPONSE_KEY_INSTALL_PARAMS = @"referring_data";
NSString * const BRANCH_RESPONSE_KEY_REFERRER = @"referrer";
NSString * const BRANCH_RESPONSE_KEY_REFERREE = @"referree";
NSString * const BRANCH_RESPONSE_KEY_URL = @"url";
NSString * const BRANCH_RESPONSE_KEY_SPOTLIGHT_IDENTIFIER = @"spotlight_identifier";
NSString * const BRANCH_RESPONSE_KEY_DEVELOPER_IDENTITY = @"identity";
NSString * const BRANCH_RESPONSE_KEY_DEVICE_FINGERPRINT_ID = @"device_fingerprint_id";
NSString * const BRANCH_RESPONSE_KEY_SESSION_DATA = @"data";
NSString * const BRANCH_RESPONSE_KEY_CLICKED_BRANCH_LINK = @"+clicked_branch_link";
NSString * const BRANCH_RESPONSE_KEY_BRANCH_VIEW_DATA = @"branch_view_data";
NSString * const BRANCH_RESPONSE_KEY_BRANCH_REFERRING_LINK = @"~referring_link";

NSString * const BRANCH_LINK_DATA_KEY_OG_TITLE = @"$og_title";
NSString * const BRANCH_LINK_DATA_KEY_OG_DESCRIPTION = @"$og_description";
NSString * const BRANCH_LINK_DATA_KEY_OG_IMAGE_URL = @"$og_image_url";
NSString * const BRANCH_LINK_DATA_KEY_TITLE = @"+spotlight_title";
NSString * const BRANCH_LINK_DATA_KEY_DESCRIPTION = @"+spotlight_description";
NSString * const BRANCH_LINK_DATA_KEY_PUBLICLY_INDEXABLE = @"$publicly_indexable";
NSString * const BRANCH_LINK_DATA_KEY_LOCALLY_INDEXABLE = @"$locally_indexable";

NSString * const BRANCH_LINK_DATA_KEY_TYPE = @"+spotlight_type";
NSString * const BRANCH_LINK_DATA_KEY_THUMBNAIL_URL = @"+spotlight_thumbnail_url";
NSString * const BRANCH_LINK_DATA_KEY_KEYWORDS = @"$keywords";
NSString * const BRANCH_LINK_DATA_KEY_CANONICAL_IDENTIFIER = @"$canonical_identifier";
NSString * const BRANCH_LINK_DATA_KEY_CANONICAL_URL = @"$canonical_url";
NSString * const BRANCH_LINK_DATA_KEY_CONTENT_EXPIRATION_DATE = @"$exp_date";
NSString * const BRANCH_LINK_DATA_KEY_CONTENT_TYPE = @"$content_type";
NSString * const BRANCH_LINK_DATA_KEY_EMAIL_SUBJECT = @"$email_subject";
NSString * const BRANCH_LINK_DATA_KEY_EMAIL_HTML_HEADER = @"$email_html_header";
NSString * const BRANCH_LINK_DATA_KEY_EMAIL_HTML_FOOTER = @"$email_html_footer";
NSString * const BRANCH_LINK_DATA_KEY_EMAIL_HTML_LINK_TEXT = @"$email_html_link_text";

NSString * const BRANCH_SPOTLIGHT_PREFIX = @"io.branch.link.v1";

NSString * const BRANCH_MANIFEST_VERSION_KEY = @"mv";
NSString * const BRANCH_HASH_MODE_KEY = @"h";
NSString * const BRANCH_MANIFEST_KEY = @"m";
NSString * const BRANCH_PATH_KEY = @"p";
NSString * const BRANCH_FILTERED_KEYS = @"ck";
NSString * const BRANCH_MAX_TEXT_LEN_KEY = @"mtl";
NSString * const BRANCH_MAX_VIEW_HISTORY_LENGTH = @"mhl";
NSString * const BRANCH_MAX_PACKET_SIZE_KEY = @"mps";
NSString * const BRANCH_CONTENT_DISCOVER_KEY = @"cd";
NSString * const BRANCH_BUNDLE_IDENTIFIER = @"pn";
NSString * const BRANCH_TIME_STAMP_KEY = @"ts";
NSString * const BRANCH_TIME_STAMP_CLOSE_KEY = @"tc";
NSString * const BRANCH_NAV_PATH_KEY = @"n";
NSString * const BRANCH_REFERRAL_LINK_KEY = @"rl";
NSString * const BRANCH_CONTENT_LINK_KEY = @"cl";
NSString * const BRANCH_CONTENT_META_DATA_KEY = @"cm";
NSString * const BRANCH_VIEW_KEY = @"v";
NSString * const BRANCH_CONTENT_DATA_KEY = @"cd";
NSString * const BRANCH_CONTENT_KEYS_KEY = @"ck";
NSString * const BRANCH_PACKAGE_NAME_KEY = @"p";
NSString * const BRANCH_ENTITIES_KEY = @"e";

NSString * const BRANCH_REQUEST_KEY_SEARCH_AD = @"search_ad_encoded";

NSString * const BRANCH_CRASHLYTICS_SDK_VERSION_KEY = @"io.branch.sdk.version";
NSString * const BRANCH_CRASHLYTICS_FINGERPRINT_ID_KEY = @"io.branch.device.fingerprintid";
NSString * const BRANCH_CRASHLYTICS_LOW_MEMORY_KEY = @"io.branch.device.lowmemory";

NSString * const BRANCH_REQUEST_KEY_EXTERNAL_INTENT_URI = @"external_intent_uri";
