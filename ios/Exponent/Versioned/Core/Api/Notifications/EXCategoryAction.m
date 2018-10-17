// Copyright 2018-present 650 Industries. All rights reserved.
#import "EXCategoryAction.h"

@implementation EXCategoryAction

+ (instancetype)parseFromParams:(NSDictionary*)params {
  if (params[@"textInput"]) {
    return [[EXCategoryActionWithTextInput alloc] initWithParams: params];
  } else {
    return [[EXCategoryAction alloc] initWithParams: params];
  }
}

- (instancetype)initWithParams:(NSDictionary*) params {
  if ( self = [super init]) {
    _actionId = params[@"actionId"];
    _actionName = params[@"buttonTitle"];
    _flags = UNNotificationActionOptionForeground;
    if (params[@"isDestructive"] && [params[@"isDestructive"] boolValue]) {
      _flags += UNNotificationActionOptionDestructive;
    }
    if (params[@"isAuthenticationRequired"] && [params[@"isAuthenticationRequired"] boolValue]) {
      _flags += UNNotificationActionOptionAuthenticationRequired;
    }
  }
  return self;
}

- (UNNotificationAction *) getUNNotificationAction {
  return [UNNotificationAction actionWithIdentifier:self.actionId
                                              title:self.actionName
                                            options:self.flags];
}

@end

@implementation EXCategoryActionWithTextInput

- (instancetype)initWithParams: (NSDictionary*) params {
  if ( self = [super initWithParams: params]) {
    NSDictionary * textInputParams = params[@"textInput"];
    _buttonName = textInputParams[@"submitButtonTitle"];
    _placeholderText = textInputParams[@"placeholder"];
  }
  return self;
}

- (UNNotificationAction *) getUNNotificationAction {
  return [UNTextInputNotificationAction actionWithIdentifier:self.actionId
                                                       title:self.actionName
                                                     options:self.flags
                                        textInputButtonTitle:self.buttonName
                                        textInputPlaceholder:self.placeholderText];
}

@end
