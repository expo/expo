/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTImageLoader.h>
#import <ABI48_0_0React/ABI48_0_0renderer/imagemanager/primitives.h>

inline static UIViewContentMode ABI48_0_0RCTContentModeFromImageResizeMode(ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode imageResizeMode)
{
  switch (imageResizeMode) {
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Cover:
      return UIViewContentModeScaleAspectFill;
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Contain:
      return UIViewContentModeScaleAspectFit;
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Stretch:
      return UIViewContentModeScaleToFill;
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Center:
      return UIViewContentModeCenter;
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Repeat:
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      return UIViewContentModeScaleToFill;
  }
}

inline std::string toString(const ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode &value)
{
  switch (value) {
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Cover:
      return "cover";
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Contain:
      return "contain";
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Stretch:
      return "stretch";
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Center:
      return "center";
    case ABI48_0_0facebook::ABI48_0_0React::ImageResizeMode::Repeat:
      return "repeat";
  }
}

inline static NSURL *NSURLFromImageSource(const ABI48_0_0facebook::ABI48_0_0React::ImageSource &imageSource)
{
  // `NSURL` has a history of crashing with bad input, so let's be safe.
  @try {
    NSString *urlString = [NSString stringWithCString:imageSource.uri.c_str() encoding:NSASCIIStringEncoding];

    if (!imageSource.bundle.empty()) {
      NSString *bundle = [NSString stringWithCString:imageSource.bundle.c_str() encoding:NSASCIIStringEncoding];
      urlString = [NSString stringWithFormat:@"%@.bundle/%@", bundle, urlString];
    }

    NSURL *url = [[NSURL alloc] initWithString:urlString];

    if (url.scheme) {
      // Well-formed absolute URL.
      return url;
    }

    if ([urlString rangeOfString:@":"].location != NSNotFound) {
      // The URL has a scheme.
      urlString = [urlString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      url = [NSURL URLWithString:urlString];
      return url;
    }

    // Assume that it's a local path.
    urlString = [urlString stringByRemovingPercentEncoding];

    if ([urlString hasPrefix:@"~"]) {
      // Path is inside user directory.
      urlString = [urlString stringByExpandingTildeInPath];
    } else {
      if (![urlString isAbsolutePath]) {
        // Assume it's a resource path.
        urlString = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:urlString];
      }
    }

    url = [NSURL fileURLWithPath:urlString];

    return url;
  } @catch (__unused NSException *exception) {
    return nil;
  }
}

inline static NSURLRequest *NSURLRequestFromImageSource(const ABI48_0_0facebook::ABI48_0_0React::ImageSource &imageSource)
{
  NSURL *url = NSURLFromImageSource(imageSource);

  if (!url) {
    ABI48_0_0RCTLogError(@"URI parsing error.");
    return nil;
  }

  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

  /*
  // TODO(shergin): To be implemented.
  request.HTTPBody = ...;
  request.HTTPMethod = ...;
  request.cachePolicy = ...;
  request.allHTTPHeaderFields = ...;
  */

  return [request copy];
}
