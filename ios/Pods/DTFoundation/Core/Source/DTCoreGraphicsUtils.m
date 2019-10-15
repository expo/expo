//
//  DTCoreGraphicsUtils.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 7/18/10.
//  Copyright 2010 Cocoanetics. All rights reserved.
//

#import "DTCoreGraphicsUtils.h"

CGSize DTCGSizeThatFitsKeepingAspectRatio(CGSize originalSize, CGSize sizeToFit)
{
	CGFloat necessaryZoomWidth = sizeToFit.width / originalSize.width;
	CGFloat necessaryZoomHeight = sizeToFit.height / originalSize.height;
	
	CGFloat smallerZoom = MIN(necessaryZoomWidth, necessaryZoomHeight);
	
	return CGSizeMake(round(originalSize.width*smallerZoom), round(originalSize.height*smallerZoom));
}

CGSize DTCGSizeThatFillsKeepingAspectRatio(CGSize originalSize, CGSize sizeToFit)
{
	CGFloat necessaryZoomWidth = sizeToFit.width / originalSize.width;
	CGFloat necessaryZoomHeight = sizeToFit.height / originalSize.height;
	
	CGFloat largerZoom = MAX(necessaryZoomWidth, necessaryZoomHeight);
	
	return CGSizeMake(round(originalSize.width*largerZoom), round(originalSize.height*largerZoom));
}

BOOL DTCGSizeMakeWithDictionaryRepresentation(NSDictionary *dict, CGSize *size)
{
	NSNumber *widthNumber = dict[@"Width"];
	NSNumber *heightNumber = dict[@"Height"];
	
	if (!widthNumber || !heightNumber)
	{
		return NO;
	}
	
	if (size)
	{
#if CGFLOAT_IS_DOUBLE
		size->width = [widthNumber doubleValue];
		size->height = [heightNumber doubleValue];
#else
		size->width = [widthNumber floatValue];
		size->height = [heightNumber floatValue];
#endif
	}
	
	return YES;
}

NSDictionary *DTCGSizeCreateDictionaryRepresentation(CGSize size)
{
#if CGFLOAT_IS_DOUBLE
	NSNumber *widthNumber = [NSNumber numberWithDouble:size.width];
	NSNumber *heightNumber = [NSNumber numberWithDouble:size.height];
#else
	NSNumber *widthNumber = [NSNumber numberWithFloat:size.width];
	NSNumber *heightNumber = [NSNumber numberWithFloat:size.height];
#endif
	
    return @{@"Width": widthNumber,
             @"Height": heightNumber};
}


BOOL DTCGRectMakeWithDictionaryRepresentation(NSDictionary *dict, CGRect *rect)
{
	NSNumber *widthNumber = dict[@"Width"];
	NSNumber *heightNumber = dict[@"Height"];
	NSNumber *xNumber = dict[@"X"];
	NSNumber *yNumber = dict[@"Y"];
	
	if (!widthNumber || !heightNumber || !xNumber || !yNumber)
	{
		return NO;
	}
	
	if (rect)
	{
#if CGFLOAT_IS_DOUBLE
		rect->origin.x = [xNumber doubleValue];
		rect->origin.y = [yNumber doubleValue];
		rect->size.width = [widthNumber doubleValue];
		rect->size.height = [heightNumber doubleValue];
#else
		rect->origin.x = [xNumber floatValue];
		rect->origin.y = [yNumber floatValue];
		rect->size.width = [widthNumber floatValue];
		rect->size.height = [heightNumber floatValue];
#endif
	}
	
	return YES;
}

NSDictionary *DTCGRectCreateDictionaryRepresentation(CGRect rect)
{
#if CGFLOAT_IS_DOUBLE
	NSNumber *widthNumber = [NSNumber numberWithDouble:rect.size.width];
	NSNumber *heightNumber = [NSNumber numberWithDouble:rect.size.height];
	NSNumber *xNumber = [NSNumber numberWithDouble:rect.origin.x];
	NSNumber *yNumber = [NSNumber numberWithDouble:rect.origin.y];
#else
	NSNumber *widthNumber = [NSNumber numberWithFloat:rect.size.width];
	NSNumber *heightNumber = [NSNumber numberWithFloat:rect.size.height];
	NSNumber *xNumber = [NSNumber numberWithFloat:rect.origin.x];
	NSNumber *yNumber = [NSNumber numberWithFloat:rect.origin.y];
#endif
	
    return @{@"Width": widthNumber,
             @"Height": heightNumber,
             @"X": xNumber,
             @"Y": yNumber};
}

CGPoint DTCGRectCenter(CGRect rect)
{
	return (CGPoint){CGRectGetMidX(rect), CGRectGetMidY(rect)};
}