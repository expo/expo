//
//  DTASN1Parser.h
//  ssltest
//
//  Created by Oliver Drobnik on 19.02.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import <DTFoundation/DTWeakSupport.h>

/**
 Types of ASN1 tags, specifying the type of the following value in TLV notation
 */
typedef NS_ENUM(NSUInteger, DTASN1Type)
{
	/**
	 DTASN1 type for EOC
	 */
	DTASN1TypeEOC = 0x00,
	
	/**
	 DTASN1 type for Boolean
	 */
	DTASN1TypeBoolean = 0x01,
	
	/**
	 DTASN1 type for integer numbers
	 */
	DTASN1TypeInteger = 0x02,
	
	/**
	 DTASN1 type for Bit Strings
	 */
	DTASN1TypeBitString = 0x03,
	
	/**
	 DTASN1 type for Octet Strings
	 */
	DTASN1TypeOctetString = 0x04,
	
	/**
	 DTASN1 type for NULL values
	 */
	DTASN1TypeNull = 0x05,
	
	/**
	 DTASN1 type for object identifiers
	 */
	DTASN1TypeObjectIdentifier = 0x06,
	
	/**
	 DTASN1 type for object descriptors
	 */
	DTASN1TypeObjectDescriptor = 0x07,
	
	/**
	 DTASN1 type for external references
	 */
	DTASN1TypeExternal = 0x08,
	
	/**
	 DTASN1 type for floating point numbers
	 */
	DTASN1TypeReal= 0x09,
	
	/**
	 DTASN1 type for enumerated values
	 */
	DTASN1TypeEnumerated = 0x0a,
	
	/**
	 DTASN1 type for embedded PDV values
	 */
	DTASN1TypeEmbeddedPDV = 0x0b,
	
	/**
	 DTASN1 type for UTF8 strings
	 */
	DTASN1TypeUTF8String = 0x0c,
	
	/**
	 DTASN1 type for sequences
	 */
	DTASN1TypeSequence = 0x10,
	
	/**
	 DTASN1 type for sets
	 */
	DTASN1TypeSet = 0x11,
	
	/**
	 DTASN1 type for numeric strings
	 */
	DTASN1TypeNumericString = 0x12,
	
	/**
	 DTASN1 type for printable strings
	 */
	DTASN1TypePrintableString = 0x13,
	
	/**
	 DTASN1 type for teletex strings
	 */
	DTASN1TypeTeletexString = 0x14,
	
	/**
	 DTASN1 type for video text strings
	 */
	DTASN1TypeVideoTextString = 0x15,
	
	/**
	 DTASN1 type for IA5 strings
	 */
	DTASN1TypeIA5String = 0x16,
	
	/**
	 DTASN1 type for UTC times
	 */
	DTASN1TypeUTCTime = 0x17,
	
	/**
	 DTASN1 type for generalized times
	 */
	DTASN1TypeGeneralizedTime = 0x18,
	
	/**
	 DTASN1 type for generalized time values
	 */
	DTASN1TypeGraphicString = 0x19,

	/**
	 DTASN1 type for visible strings
	 */
	DTASN1TypeVisibleString = 0x1a,
	
	/**
	 DTASN1 type for general strings
	 */
	DTASN1TypeGeneralString = 0x1b,
	
	/**
	 DTASN1 type for universal strings
	 */
	DTASN1TypeUniversalString = 0x1c,
	
	/**
	 DTASN1 type for bitmap strings
	 */
	DTASN1TypeBitmapString = 0x1e,
	
	/**
	 DTASN1 value to signify that the value uses the long form
	 */
	DTASN1TypeUsesLongForm = 0x1f
};

@class DTASN1Parser, DTASN1BitString;

/** The DTASN1ParserDelegate protocol defines the optional methods implemented by delegates of DTASN1Parser objects. 
 */
@protocol DTASN1ParserDelegate <NSObject>

@optional

/**
 Sent by the parser object to the delegate when it begins parsing a document.
 
 @param parser A parser object.
 */
- (void)parserDidStartDocument:(DTASN1Parser *)parser;

/**
 Sent by the parser object to the delegate when it has successfully completed parsing
 
 @param parser A parser object.
 */
- (void)parserDidEndDocument:(DTASN1Parser *)parser;

/**
 Sent by a parser object to its delegate when it encounters the beginning of a constructed element.
 
 @param parser A parser object.
 @param type The tag type that contains the subsequent elements.
 */
- (void)parser:(DTASN1Parser *)parser didStartContainerWithType:(DTASN1Type)type;

/**
 Sent by a parser object to its delegate when it encounters the end of a constructed element.
 
 @param parser A parser object.
 @param type A string that is the name of an element (in its end tag).
 */
- (void)parser:(DTASN1Parser *)parser didEndContainerWithType:(DTASN1Type)type;

/**
 Sent by a parser object to its delegate when it encounters the beginning of a context-specific tag.
 
 @param parser A parser object.
 @param tag The tag value for the context that contains the subsequent elements.
 */
- (void)parser:(DTASN1Parser *)parser didStartContextWithTag:(NSUInteger)tag;

/**
 Sent by a parser object to its delegate when it encounters the end of a constructed element.
 
 @param parser A parser object.
 @param tag The tag value for the context that contained the previous elements.
 */
- (void)parser:(DTASN1Parser *)parser didEndContextWithTag:(NSUInteger)tag;

/**
 Sent by a parser object to its delegate when it encounters a fatal error.
 
 When this method is invoked, parsing is stopped. For further information about the error, you can query parseError or you can send the parser a parserError message. You can also send the parser lineNumber and columnNumber messages to further isolate where the error occurred. Typically you implement this method to display information about the error to the user.
 
 @param parser A parser object.
 @param parseError An `NSError` object describing the parsing error that occurred.
 */
- (void)parser:(DTASN1Parser *)parser parseErrorOccurred:(NSError *)parseError;

/**
 Sent by a parser object when a NULL element is encountered.
 
 @param parser A parser object.
 */
- (void)parserFoundNull:(DTASN1Parser *)parser;

/**
 Sent by a parser object to provide its delegate with the date encoded in the current element.
 
 All the ASN1 date types are provided via this method.
 
 @param parser A parser object.
 @param date A date representing the date encoded in the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundDate:(NSDate *)date;

/**
 Sent by a parser object to provide its delegate with the object identifier encoded in the current element.
 
 @param parser A parser object.
 @param objIdentifier A string representing the object identifier encoded in the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundObjectIdentifier:(NSString *)objIdentifier;

/**
 Sent by a parser object to provide its delegate with the string encoded in the current element.
 
 All the ASN1 string types are provided via this method.
 
 @param parser A parser object.
 @param string A string contained in the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundString:(NSString *)string;

/**
 Sent by a parser object to provide its delegate with the octet string encoded in the current element.
 
 Integer data that is longer than 32 bits is also provided this way.
 
 @param parser A parser object.
 @param data A data object representing the contents of the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundData:(NSData *)data;

/**
 Sent by a parser object to provide its delegate with the bit string encoded in the current element.
 
 @param parser A parser object.
 @param bitString A bit string object representing the contents of the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundBitString:(DTASN1BitString *)bitString;

/**
 Sent by a parser object to provide its delegate with number values encoded in the current element.
 
 Note that number values that are longer than supported by the system are provided as Data instead.
 
 @param parser A parser object.
 @param number A number object representing the contents of the current element.
 */
- (void)parser:(DTASN1Parser *)parser foundNumber:(NSNumber *)number;
@end

/** Instances of this class parse ASN1 documents in an event-driven manner. A DTASN1Parser notifies its delegate about the items (elements, collections, and so on) that it encounters as it processes an ASN1 document. It does not itself do anything with those parsed items except report them. It also reports parsing errors. For convenience, a DTASN1Parser object in the following descriptions is sometimes referred to as a parser object.
 */
@interface DTASN1Parser : NSObject

/**-------------------------------------------------------------------------------------
 @name Initializing a Parser Object
 ---------------------------------------------------------------------------------------
 */

/**
 Initializes the receiver with the ASN1 contents encapsulated in a given data object.
 
 @param data An `NSData` object containing ASN1 encoded data.
 @returns An initialized `DTASN1Parser` object or nil if an error occurs. 
 */
- (id)initWithData:(NSData *)data;

/**-------------------------------------------------------------------------------------
 @name Parsing
 ---------------------------------------------------------------------------------------
 */

/**
 Starts the event-driven parsing operation.
 
 If you invoke this method, the delegate, if it implements parser:parseErrorOccurred:, is informed of the cancelled parsing operation.
 
 @returns `YES` if parsing is successful and `NO` in there is an error or if the parsing operation is aborted. 
 */
- (BOOL)parse;


/**
 Stops the parser object.
 
 @see parse
 @see parserError
 */
- (void)abortParsing;

/**
 An object that is the parsing delegate. It is not retained. The delegate must conform to the DTASN1ParserDelegate Protocol protocol.
 */
@property (nonatomic, DT_WEAK_PROPERTY) id <DTASN1ParserDelegate>delegate;


/**
 Returns an `NSError` object from which you can obtain information about a parsing error.
 
 You may invoke this method after a parsing operation abnormally terminates to determine the cause of error.
 */
@property (nonatomic, readonly, strong) NSError *parserError;

@end
