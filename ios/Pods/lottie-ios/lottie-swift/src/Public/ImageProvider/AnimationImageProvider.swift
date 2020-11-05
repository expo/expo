//
//  LottieImageProvider.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation
import CoreGraphics

/**
 Image provider is a protocol that is used to supply images to `AnimationView`.
 
 Some animations require a reference to an image. The image provider loads and
 provides those images to the `AnimationView`.  Lottie includes a couple of
 prebuilt Image Providers that supply images from a Bundle, or from a FilePath.
 
 Additionally custom Image Providers can be made to load images from a URL,
 or to Cache images.
 */
public protocol AnimationImageProvider {
  func imageForAsset(asset: ImageAsset) -> CGImage?
}
