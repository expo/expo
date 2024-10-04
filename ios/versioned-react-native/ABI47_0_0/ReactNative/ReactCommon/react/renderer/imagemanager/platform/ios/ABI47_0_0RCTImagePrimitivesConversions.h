/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTImageLoader.h>
#import <ABI47_0_0React/ABI47_0_0renderer/imagemanager/primitives.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

inline static UIViewContentMode ABI47_0_0RCTContentModeFromImageResizeMode(ImageResizeMode imageResizeMode)
{
  switch (imageResizeMode) {
    case ImageResizeMode::Cover:
      return UIViewContentModeScaleAspectFill;
    case ImageResizeMode::Contain:
      return UIViewContentModeScaleAspectFit;
    case ImageResizeMode::Stretch:
      return UIViewContentModeScaleToFill;
    case ImageResizeMode::Center:
      return UIViewContentModeCenter;
    case ImageResizeMode::Repeat:
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      return UIViewContentModeScaleToFill;
  }
}

inline std::string toString(const ImageResizeMode &value)
{
  switch (value) {
    case ImageResizeMode::Cover:
      return "cover";
    case ImageResizeMode::Contain:
      return "contain";
    case ImageResizeMode::Stretch:
      return "stretch";
    case ImageResizeMode::Center:
      return "center";
    case ImageResizeMode::Repeat:
      return "repeat";
  }
}

inline static NSURL *NSURLFromImageSource(const ImageSource &imageSource)
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

inline static NSURLRequest *NSURLRequestFromImageSource(const ImageSource &imageSource)
{
  NSURL *url = NSURLFromImageSource(imageSource);

  if (!url) {
    ABI47_0_0RCTLogError(@"URI parsing error.");
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
