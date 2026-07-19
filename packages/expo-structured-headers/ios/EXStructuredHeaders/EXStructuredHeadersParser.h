//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXStructuredHeadersParserFieldType) {
  EXStructuredHeadersParserFieldTypeDictionary,
  EXStructuredHeadersParserFieldTypeList,
  EXStructuredHeadersParserFieldTypeItem
};

@interface EXStructuredHeadersParser : NSObject

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(EXStructuredHeadersParserFieldType)fieldType;

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(EXStructuredHeadersParserFieldType)fieldType
              ignoringParameters:(BOOL)shouldIgnoreParameters;

- (nullable id)parseStructuredFieldsWithError:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
