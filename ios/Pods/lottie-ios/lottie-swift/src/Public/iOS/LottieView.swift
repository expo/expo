//
//  LottieView.swift
//  lottie-swift-iOS
//
//  Created by Brandon Withrow on 2/6/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit

//public typealias LottieView = UIView

open class LottieView: UIView {

  var viewLayer: CALayer? {
    return layer
  }

  func layoutAnimation() {

  }
  
  func animationMovedToWindow() {
    
  }
  
  open override func didMoveToWindow() {
    super.didMoveToWindow()
    animationMovedToWindow()
  }
  
  var screenScale: CGFloat {
    return UIScreen.main.scale
  }

  func commonInit() {
    contentMode = .scaleAspectFit
    clipsToBounds = true
    NotificationCenter.default.addObserver(self, selector: #selector(animationWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(animationWillMoveToBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
  }

  open override var contentMode: UIView.ContentMode {
    didSet {
      setNeedsLayout()
    }
  }

  open override func layoutSubviews() {
    super.layoutSubviews()
    self.layoutAnimation()
  }
  
  @objc func animationWillMoveToBackground() {
  }
  
  @objc func animationWillEnterForeground() {
  }
  
}
#endif
