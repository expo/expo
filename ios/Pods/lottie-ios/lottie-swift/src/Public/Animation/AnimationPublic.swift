//
//  AnimationPublic.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/5/19.
//

import Foundation
import CoreGraphics

public extension Animation {
  
  // MARK: Animation (Loading)
  
  /**
   Loads an animation model from a bundle by its name. Returns `nil` if an animation is not found.
   
   - Parameter name: The name of the json file without the json extension. EG "StarAnimation"
   - Parameter bundle: The bundle in which the animation is located. Defaults to `Bundle.main`
   - Parameter subdirectory: A subdirectory in the bundle in which the animation is located. Optional.
   - Parameter animationCache: A cache for holding loaded animations. Optional.
   
   - Returns: Deserialized `Animation`. Optional.
   */
  static func named(_ name: String,
                           bundle: Bundle = Bundle.main,
                           subdirectory: String? = nil,
                           animationCache: AnimationCacheProvider? = nil) -> Animation? {
    /// Create a cache key for the animation.
    let cacheKey = bundle.bundlePath + (subdirectory ?? "") + "/" + name
    
    /// Check cache for animation
    if let animationCache = animationCache,
      let animation = animationCache.animation(forKey: cacheKey) {
      /// If found, return the animation.
      return animation
    }
    /// Make sure the bundle has a file at the path provided.
    guard let url = bundle.url(forResource: name, withExtension: "json", subdirectory: subdirectory) else {
      return nil
    }
    
    do {
      /// Decode animation.
      let json = try Data(contentsOf: url)
      let animation = try JSONDecoder().decode(Animation.self, from: json)
      animationCache?.setAnimation(animation, forKey: cacheKey)
      return animation
    } catch {
      /// Decoding error.
      print(error)
      return nil
    }
  }
  
  /**
   Loads an animation from a specific filepath.
   - Parameter filepath: The absolute filepath of the animation to load. EG "/User/Me/starAnimation.json"
   - Parameter animationCache: A cache for holding loaded animations. Optional.
   
   - Returns: Deserialized `Animation`. Optional.
   */
  static func filepath(_ filepath: String,
                              animationCache: AnimationCacheProvider? = nil) -> Animation? {
    
    /// Check cache for animation
    if let animationCache = animationCache,
      let animation = animationCache.animation(forKey: filepath) {
      return animation
    }

    do {
      /// Decode the animation.
      let json = try Data(contentsOf: URL(fileURLWithPath: filepath))
      let animation = try JSONDecoder().decode(Animation.self, from: json)
      animationCache?.setAnimation(animation, forKey: filepath)
      return animation
    } catch {
      /// Decoding Error.
      return nil
    }
  }
  
  /// A closure for an Animation download. The closure is passed `nil` if there was an error.
  typealias DownloadClosure = (Animation?) -> Void
  
  /**
   Loads a Lottie animation asynchronously from the URL.
   
   - Parameter url: The url to load the animation from.
   - Parameter closure: A closure to be called when the animation has loaded.
   - Parameter animationCache: A cache for holding loaded animations.
   
   */
  static func loadedFrom(url: URL,
                                closure: @escaping Animation.DownloadClosure,
                                animationCache: AnimationCacheProvider?) {
    
    if let animationCache = animationCache, let animation = animationCache.animation(forKey: url.absoluteString) {
      closure(animation)
    } else {
      let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
        guard error == nil, let jsonData = data else {
          DispatchQueue.main.async {
            closure(nil)
          }
          return
        }
        do {
          let animation = try JSONDecoder().decode(Animation.self, from: jsonData)
          DispatchQueue.main.async {
            animationCache?.setAnimation(animation, forKey: url.absoluteString)
            closure(animation)
          }
        } catch {
          DispatchQueue.main.async {
            closure(nil)
          }
        }
        
      }
      task.resume()
    }
  }
  
  // MARK: Animation (Helpers)
  
  /**
   Markers are a way to describe a point in time by a key name.
   
   Markers are encoded into animation JSON. By using markers a designer can mark
   playback points for a developer to use without having to worry about keeping
   track of animation frames. If the animation file is updated, the developer
   does not need to update playback code.
   
   Returns the Progress Time for the marker named. Returns nil if no marker found.
   */
  func progressTime(forMarker named: String) -> AnimationProgressTime? {
    guard let markers = markerMap, let marker = markers[named] else {
      return nil
    }
    return progressTime(forFrame: marker.frameTime)
  }
  
  /**
   Markers are a way to describe a point in time by a key name.
   
   Markers are encoded into animation JSON. By using markers a designer can mark
   playback points for a developer to use without having to worry about keeping
   track of animation frames. If the animation file is updated, the developer
   does not need to update playback code.
   
   Returns the Frame Time for the marker named. Returns nil if no marker found.
   */
  func frameTime(forMarker named: String) -> AnimationFrameTime? {
    guard let markers = markerMap, let marker = markers[named] else {
      return nil
    }
    return marker.frameTime
  }
  
  /// Converts Frame Time (Seconds * Framerate) into Progress Time (0 to 1).
  func progressTime(forFrame frameTime: AnimationFrameTime) -> AnimationProgressTime {
    return ((frameTime - startFrame) / (endFrame - startFrame)).clamp(0, 1)
  }
  
  /// Converts Progress Time (0 to 1) into Frame Time (Seconds * Framerate)
  func frameTime(forProgress progressTime: AnimationProgressTime) -> AnimationFrameTime {
    return ((endFrame - startFrame) * progressTime) + startFrame
  }
  
  /// Converts Frame Time (Seconds * Framerate) into Time (Seconds)
  func time(forFrame frameTime: AnimationFrameTime) -> TimeInterval {
    return Double(frameTime - startFrame) / framerate
  }
  
  /// Converts Time (Seconds) into Frame Time (Seconds * Framerate)
  func frameTime(forTime time: TimeInterval) -> AnimationFrameTime {
    return CGFloat(time * framerate) + startFrame
  }
  
  /// The duration in seconds of the animation.
  var duration: TimeInterval {
    return Double(endFrame - startFrame) / framerate
  }
  
  /// The natural bounds in points of the animation.
  var bounds: CGRect {
    return CGRect(x: 0, y: 0, width: width, height: height)
  }
  
  /// The natural size in points of the animation.
  var size: CGSize {
    return CGSize(width: width, height: height)
  }
}
