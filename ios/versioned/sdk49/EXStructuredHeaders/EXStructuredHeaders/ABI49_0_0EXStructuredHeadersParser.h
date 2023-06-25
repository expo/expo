//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI49_0_0EXStructuredHeadersParserFieldType) {
  ABI49_0_0EXStructuredHeadersParserFieldTypeDictionary,
  ABI49_0_0EXStructuredHeadersParserFieldTypeList,
  ABI49_0_0EXStructuredHeadersParserFieldTypeItem
};

@interface ABI49_0_0EXStructuredHeadersParser : NSObject

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI49_0_0EXStructuredHeadersParserFieldType)fieldType;

- (instancetype)initWithRawInput:(NSString *)raw
                       fieldType:(ABI49_0_0EXStructuredHeadersParserFieldType)fieldType
              ignoringParameters:(BOOL)shouldIgnoreParameters;

- (nullable id)parseStructuredFieldsWithError:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
