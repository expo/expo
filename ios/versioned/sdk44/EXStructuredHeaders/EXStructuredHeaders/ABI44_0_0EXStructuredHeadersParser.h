//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI44_0_0EXStructuredHeadersParserFieldType) {
  ABI44_0_0EXStructuredHeadersParserFieldTypeDictionary,
  ABI44_0_0EXStructuredHeadersParserFieldTypeList,
  ABI44_0_0EXStructuredHeadersParserFieldTypeItem
};

@interface ABI44_0_0EXStructuredHeadersParser : NSObject

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI44_0_0EXStructuredHeadersParserFieldType)fieldType;

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI44_0_0EXStructuredHeadersParserFieldType)fieldType
              ignoringParameters:(BOOL)shouldIgnoreParameters;

- (nullable id)parseStructuredFieldsWithError:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
