// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationBuilder.h>

@interface NSDictionary (EXNotificationBuilderVerifyingClass)

- (id)objectForKey:(id)aKey verifyingClass:(__unsafe_unretained Class)klass;

@end

@implementation EXNotificationBuilder

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXNotificationBuilder)];
}

- (UNNotificationContent *)notificationContentFromRequest:(NSDictionary *)request
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  [content setTitle:[request objectForKey:@"title" verifyingClass:[NSString class]]];
  [content setSubtitle:[request objectForKey:@"subtitle" verifyingClass:[NSString class]]];
  [content setBody:[request objectForKey:@"message" verifyingClass:[NSString class]]];
  [content setLaunchImageName:[request objectForKey:@"launchImageName" verifyingClass:[NSString class]]];
  [content setBadge:[request objectForKey:@"badge" verifyingClass:[NSNumber class]]];
  [content setUserInfo:[request objectForKey:@"body" verifyingClass:[NSDictionary class]]];
  if ([request objectForKey:@"sound" verifyingClass:[NSNumber class]]) {
    [content setSound:[request[@"sound"] boolValue] ? [UNNotificationSound defaultSound] : nil];
  }
  NSMutableArray<UNNotificationAttachment *> *attachments = [NSMutableArray new];
  [[request objectForKey:@"attachments" verifyingClass:[NSArray class]] enumerateObjectsUsingBlock:^(NSDictionary * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    UNNotificationAttachment *attachment = [self attachmentFromRequest:obj];
    if (attachment) {
      [attachments addObject:attachment];
    }
  }];
  [content setAttachments:attachments];
  return content;
}

- (UNNotificationAttachment *)attachmentFromRequest:(NSDictionary *)request
{
  NSString *identifier = [request objectForKey:@"identifier" verifyingClass:[NSString class]] ?: @"";
  NSURL *uri = [NSURL URLWithString:[request objectForKey:@"uri" verifyingClass:[NSString class]]];
  NSError *error = nil;
  UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:identifier URL:uri options:[self attachmentOptionsFromRequest:request] error:&error];
  if (error) {
    UMLogWarn(@"[expo-notifications] Could not have created a notification attachment out of request: %@. Error: %@.", [request description], [error description]);
    return nil;
  }
  return attachment;
}

- (NSDictionary *)attachmentOptionsFromRequest:(NSDictionary *)request
{
  NSMutableDictionary *options = [NSMutableDictionary new];
  if ([request objectForKey:@"typeHint" verifyingClass:[NSString class]]) {
    options[UNNotificationAttachmentOptionsTypeHintKey] = request[@"typeHint"];
  }
  if ([request objectForKey:@"hideThumbnail" verifyingClass:[NSNumber class]]) {
    options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = request[@"hideThumbnail"];
  }
  if ([request objectForKey:@"thumbnailClipArea" verifyingClass:[NSDictionary class]]) {
    NSDictionary *area = request[@"thumbnailClipArea"];
    NSNumber *x = [area objectForKey:@"x" verifyingClass:[NSNumber class]];
    NSNumber *y = [area objectForKey:@"y" verifyingClass:[NSNumber class]];
    NSNumber *width = [area objectForKey:@"width" verifyingClass:[NSNumber class]];
    NSNumber *height = [area objectForKey:@"height" verifyingClass:[NSNumber class]];
    CGRect areaRect = CGRectMake([x doubleValue], [y doubleValue], [width doubleValue], [height doubleValue]);
    options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = (__bridge id _Nullable)(CGRectCreateDictionaryRepresentation(areaRect));
  }
  if ([request objectForKey:@"thumbnailTime" verifyingClass:[NSNumber class]]) {
    options[UNNotificationAttachmentOptionsThumbnailTimeKey] = request[@"thumbnailTime"];
  }
  return options;
}

@end

static NSString * const invalidValueExceptionName = @"Value of invalid class encountered";
static NSString * const invalidValueClassReasonFormat = @"Value under key `%@` is of class %@, while %@ was expected.";

@implementation NSDictionary (EXNotificationBuilderVerifyingClass)

- (id)objectForKey:(id)aKey verifyingClass:(__unsafe_unretained Class)klass
{
  id obj = [self objectForKey:aKey];
  if (!obj || [obj isKindOfClass:klass]) {
    return obj;
  }

  NSString *reason = [NSString stringWithFormat:invalidValueClassReasonFormat, aKey, NSStringFromClass([obj class]), NSStringFromClass(klass)];
  @throw [NSException exceptionWithName:invalidValueExceptionName reason:reason userInfo:nil];
}

@end
