//
//  CompatibleAnimationKeypath.swift
//  Lottie_iOS
//
//  Created by Tyler Hedrick on 3/6/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)

/// An Objective-C compatible wrapper around Lottie's AnimationKeypath
@objc
public final class CompatibleAnimationKeypath: NSObject {

  /// Creates a keypath from a dot separated string. The string is separated by "."
  @objc
  public init(keypath: String) {
    animationKeypath = AnimationKeypath(keypath: keypath)
  }

  /// Creates a keypath from a list of strings.
  @objc
  public init(keys: [String]) {
    animationKeypath = AnimationKeypath(keys: keys)
  }

  public let animationKeypath: AnimationKeypath
}
#endif
