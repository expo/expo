//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI43_0_0EXStructuredHeadersParserFieldType) {
  ABI43_0_0EXStructuredHeadersParserFieldTypeDictionary,
  ABI43_0_0EXStructuredHeadersParserFieldTypeList,
  ABI43_0_0EXStructuredHeadersParserFieldTypeItem
};

@interface ABI43_0_0EXStructuredHeadersParser : NSObject

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI43_0_0EXStructuredHeadersParserFieldType)fieldType;

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI43_0_0EXStructuredHeadersParserFieldType)fieldType
              ignoringParameters:(BOOL)shouldIgnoreParameters;

- (nullable id)parseStructuredFieldsWithError:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
