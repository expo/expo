//
//  CLSStackFrame.h
//  Crashlytics
//
//  Copyright 2015 Crashlytics, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CLSAttributes.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *
 * This class is used in conjunction with -[Crashlytics recordCustomExceptionName:reason:frameArray:] to
 * record information about non-ObjC/C++ exceptions. All information included here will be displayed 
 * in the Crashlytics UI, and can influence crash grouping. Be particularly careful with the use of the 
 * address property. If set, Crashlytics will attempt symbolication and could overwrite other properities 
 * in the process.
 *
 **/
@interface CLSStackFrame : NSObject

+ (instancetype)stackFrame;
+ (instancetype)stackFrameWithAddress:(NSUInteger)address;
+ (instancetype)stackFrameWithSymbol:(NSString *)symbol;

@property (nonatomic, copy, nullable) NSString *symbol;
@property (nonatomic, copy, nullable) NSString *rawSymbol;
@property (nonatomic, copy, nullable) NSString *library;
@property (nonatomic, copy, nullable) NSString *fileName;
@property (nonatomic, assign) uint32_t lineNumber;
@property (nonatomic, assign) uint64_t offset;
@property (nonatomic, assign) uint64_t address;

@end

NS_ASSUME_NONNULL_END
