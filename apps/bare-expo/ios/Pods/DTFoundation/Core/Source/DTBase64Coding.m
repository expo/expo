//
//  DTBase64Coding.m
//  DTFoundation
//
//  Original code from NSData+Base64.m
//
//  Created by Matt Gallagher on 2009/06/03.
//  Copyright 2009 Matt Gallagher. All rights reserved.
//
//  This software is provided 'as-is', without any express or implied
//  warranty. In no event will the authors be held liable for any damages
//  arising from the use of this software. Permission is granted to anyone to
//  use this software for any purpose, including commercial applications, and to
//  alter it and redistribute it freely, subject to the following restrictions:
//
//  1. The origin of this software must not be misrepresented; you must not
//     claim that you wrote the original software. If you use this software
//     in a product, an acknowledgment in the product documentation would be
//     appreciated but is not required.
//  2. Altered source versions must be plainly marked as such, and must not be
//     misrepresented as being the original software.
//  3. This notice may not be removed or altered from any source
//     distribution.


#import "DTBase64Coding.h"


// Function Prototypes
void *DT__NewBase64Decode(const char *inputBuffer, size_t length, size_t *outputLength);
char *DT__NewBase64Encode(const void *buffer, size_t length, bool separateLines, size_t *outputLength);

//
// Mapping from 6 bit pattern to ASCII character.
//
static unsigned char base64EncodeLookup[65] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

//
// Definition for "masked-out" areas of the base64DecodeLookup mapping
//
#define xx 65

//
// Mapping from ASCII character to 6 bit pattern.
//
static unsigned char base64DecodeLookup[256] =
{
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, 62, xx, xx, xx, 63,
	52, 53, 54, 55, 56, 57, 58, 59, 60, 61, xx, xx, xx, xx, xx, xx,
	xx,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
	15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, xx, xx, xx, xx, xx,
	xx, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
	xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx, xx,
};

//
// Fundamental sizes of the binary and base64 encode/decode units in bytes
//
#define BINARY_UNIT_SIZE 3
#define BASE64_UNIT_SIZE 4

//
// NewBase64Decode
//
// Decodes the base64 ASCII string in the inputBuffer to a newly malloced
// output buffer.
//
//  inputBuffer - the source ASCII string for the decode
//	length - the length of the string or -1 (to specify strlen should be used)
//	outputLength - if not-NULL, on output will contain the decoded length
//
// returns the decoded buffer. Must be free'd by caller. Length is given by
//	outputLength.
//
void *DT__NewBase64Decode ( const char *inputBuffer, size_t length, size_t *outputLength)
{
	if ((long)length == -1)
	{
		length = strlen(inputBuffer);
	}
    
	size_t outputBufferSize =
	((length+BASE64_UNIT_SIZE-1) / BASE64_UNIT_SIZE) * BINARY_UNIT_SIZE;
	unsigned char *outputBuffer = (unsigned char *)malloc(outputBufferSize);
    
	size_t i = 0;
	size_t j = 0;
	while (i < length)
	{
		//
		// Accumulate 4 valid characters (ignore everything else)
		//
		unsigned char accumulated[BASE64_UNIT_SIZE];
		size_t accumulateIndex = 0;
		while (i < length)
		{
			unsigned char decode = base64DecodeLookup[(int) inputBuffer[i++]];
			if (decode != xx)
			{
				accumulated[accumulateIndex] = decode;
				accumulateIndex++;
                
				if (accumulateIndex == BASE64_UNIT_SIZE)
				{
					break;
				}
			}
		}
        
		//
		// Store the 6 bits from each of the 4 characters as 3 bytes
		//
		// (Uses improved bounds checking suggested by Alexandre Colucci)
		//
		if(accumulateIndex >= 2)
			outputBuffer[j] = (unsigned char)((accumulated[0] << 2) | (accumulated[1] >> 4));
		if(accumulateIndex >= 3)
			outputBuffer[j + 1] = (unsigned char)((accumulated[1] << 4) | (accumulated[2] >> 2));
		if(accumulateIndex >= 4)
			outputBuffer[j + 2] = (unsigned char)((accumulated[2] << 6) | accumulated[3]);
		j += accumulateIndex - 1;
	}
    
	if (outputLength)
	{
		*outputLength = j;
	}
	return outputBuffer;
}

//
// NewBase64Encode
//
// Encodes the arbitrary data in the inputBuffer as base64 into a newly malloced
// output buffer.
//
//  inputBuffer - the source data for the encode
//	length - the length of the input in bytes
//  separateLines - if zero, no CR/LF characters will be added. Otherwise
//		a CR/LF pair will be added every 64 encoded chars.
//	outputLength - if not-NULL, on output will contain the encoded length
//		(not including terminating 0 char)
//
// returns the encoded buffer. Must be free'd by caller. Length is given by
//	outputLength.
//
char *DT__NewBase64Encode(const void *buffer, size_t length, bool separateLines, size_t *outputLength)
{
	const unsigned char *inputBuffer = (const unsigned char *)buffer;
	
#define MAX_NUM_PADDING_CHARS 2
#define OUTPUT_LINE_LENGTH 64
#define INPUT_LINE_LENGTH ((OUTPUT_LINE_LENGTH / BASE64_UNIT_SIZE) * BINARY_UNIT_SIZE)
#define CR_LF_SIZE 2
    
	//
	// Byte accurate calculation of final buffer size
	//
	size_t outputBufferSize =
	((length / BINARY_UNIT_SIZE)
	 + ((length % BINARY_UNIT_SIZE) ? 1 : 0))
	* BASE64_UNIT_SIZE;
	if (separateLines)
	{
		outputBufferSize +=
		(outputBufferSize / OUTPUT_LINE_LENGTH) * CR_LF_SIZE;
	}
    
	//
	// Include space for a terminating zero
	//
	outputBufferSize += 1;
    
	//
	// Allocate the output buffer
	//
	char *outputBuffer = (char *)malloc(outputBufferSize);
	if (!outputBuffer)
	{
		return NULL;
	}
    
	size_t index = 0;
	size_t index2 = 0;
	const size_t lineLength = separateLines ? INPUT_LINE_LENGTH : length;
	size_t lineEnd = lineLength;
    
	while (true)
	{
		if (lineEnd > length)
		{
			lineEnd = length;
		}
        
		for (; index + BINARY_UNIT_SIZE - 1 < lineEnd; index += BINARY_UNIT_SIZE)
		{
			//
			// Inner loop: turn 48 bytes into 64 base64 characters
			//
			outputBuffer[index2++] = base64EncodeLookup[(inputBuffer[index] & 0xFC) >> 2];
			outputBuffer[index2++] = base64EncodeLookup[((inputBuffer[index] & 0x03) << 4)
                                                   | ((inputBuffer[index + 1] & 0xF0) >> 4)];
			outputBuffer[index2++] = base64EncodeLookup[((inputBuffer[index + 1] & 0x0F) << 2)
                                                   | ((inputBuffer[index + 2] & 0xC0) >> 6)];
			outputBuffer[index2++] = base64EncodeLookup[inputBuffer[index + 2] & 0x3F];
		}
        
		if (lineEnd == length)
		{
			break;
		}
        
		//
		// Add the newline
		//
		outputBuffer[index2++] = '\r';
		outputBuffer[index2++] = '\n';
		lineEnd += lineLength;
	}
    
	if (index + 1 < length)
	{
		//
		// Handle the single '=' case
		//
		outputBuffer[index2++] = base64EncodeLookup[(inputBuffer[index] & 0xFC) >> 2];
		outputBuffer[index2++] = base64EncodeLookup[((inputBuffer[index] & 0x03) << 4)
                                               | ((inputBuffer[index + 1] & 0xF0) >> 4)];
		outputBuffer[index2++] = base64EncodeLookup[(inputBuffer[index + 1] & 0x0F) << 2];
		outputBuffer[index2++] =	'=';
	}
	else if (index < length)
	{
		//
		// Handle the double '=' case
		//
		outputBuffer[index2++] = base64EncodeLookup[(inputBuffer[index] & 0xFC) >> 2];
		outputBuffer[index2++] = base64EncodeLookup[(inputBuffer[index] & 0x03) << 4];
		outputBuffer[index2++] = '=';
		outputBuffer[index2++] = '=';
	}
	outputBuffer[index2] = 0;
    
	//
	// Set the output length and return the buffer
	//
	if (outputLength)
	{
		*outputLength = index2;
	}
	return outputBuffer;
}

@implementation DTBase64Coding

// this is abstract and not meant to be actually used
- (id)init
{
    [NSException raise:@"DTAbstractClassException" format:@"You tried to call %@ on an abstract class %@",  NSStringFromSelector(_cmd), NSStringFromClass([self class])];

    return nil;
}

#pragma mark - Encoding and Decoding

+ (NSString *)stringByEncodingData:(NSData *)data
{
    size_t outputLength = 0;
	char *outputBuffer = DT__NewBase64Encode([data bytes], [data length], true, &outputLength);
    
	NSString *result = [[NSString alloc] initWithBytes:outputBuffer length:outputLength encoding:NSASCIIStringEncoding];
	free(outputBuffer);
	return result;
}

+ (NSData *)dataByDecodingString:(NSString *)string
{
   	NSData *data = [string dataUsingEncoding:NSASCIIStringEncoding];
	size_t outputLength;
	void *outputBuffer = DT__NewBase64Decode([data bytes], [data length], &outputLength);
	NSData *result = [NSData dataWithBytes:outputBuffer length:outputLength];
	free(outputBuffer);
	return result;
}

@end
