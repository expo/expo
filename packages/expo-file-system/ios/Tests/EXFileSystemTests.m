//  Copyright (c) 2023 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <EXFileSystem/EXFileSystem.h>

@interface EXFileSystemTests : XCTestCase

@end

@implementation EXFileSystemTests

- (void)testPercentEncodeURIStringAfterScheme
{
  EXFileSystem *fileSystem = [[EXFileSystem alloc] init];

  NSString *encodedUriInput = @"file:///var/mobile/%40username%2Fbranch";
  NSString *encodedUriExpectedOutput = @"file:///var/mobile/@username/branch";
  NSURL *encodedUri = [fileSystem percentEncodeURIStringAfterScheme:encodedUriInput];
  XCTAssert([encodedUriExpectedOutput isEqualToString:encodedUri.absoluteString], @"should handle encoded URIs");
  XCTAssert([@"file" isEqualToString:encodedUri.scheme], @"should identify the file scheme");

  NSString *utf8UriInput = @"file:///var/mobile/中文";
  NSString *utf8UriExpectedOutput = @"file:///var/mobile/%E4%B8%AD%E6%96%87";
  NSURL *utf8Uri = [fileSystem percentEncodeURIStringAfterScheme:utf8UriInput];
  XCTAssert([utf8UriExpectedOutput isEqualToString:utf8Uri.absoluteString], @"should handle UTF-8 characters");
  XCTAssert([@"file" isEqualToString:utf8Uri.scheme], @"should identify the file scheme");

  NSString *assetsLibraryUriInput = @"assets-library://asset/asset.JPG?id=3C1D9C54-9521-488F-BB27-AA1EA0F8AF04/L0/001&ext=JPG";
  NSURL *assetsLibraryUri = [fileSystem percentEncodeURIStringAfterScheme:assetsLibraryUriInput];
  XCTAssert([@"assets-library" isEqualToString:assetsLibraryUri.scheme], @"should identify the assets-library scheme");
  XCTAssert([assetsLibraryUriInput isEqualToString:assetsLibraryUri.absoluteString], @"should handle assets-library URIs");
}

@end

