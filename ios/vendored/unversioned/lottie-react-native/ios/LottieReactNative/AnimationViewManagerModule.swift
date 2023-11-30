import Lottie

#if os(OSX)
import AppKit

typealias View = NSView

#else
import UIKit

typealias View = UIView

#endif

@objc(LottieAnimationView)
class AnimationViewManagerModule: RCTViewManager {
    override func view() -> View! {
        return ContainerView()
    }

    @objc override func constantsToExport() -> [AnyHashable: Any]! {
        return ["VERSION": 1]
    }

    @objc(play:fromFrame:toFrame:)
    public func play(_ reactTag: NSNumber, startFrame: NSNumber, endFrame: NSNumber) {
        self.bridge.uiManager.addUIBlock { (_, viewRegistry) in
            guard let view = viewRegistry?[reactTag] as? ContainerView else {
                if RCT_DEBUG == 1 {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            if startFrame.intValue != -1 && endFrame.intValue != -1 {
                view.play(fromFrame: AnimationFrameTime(truncating: startFrame), toFrame: AnimationFrameTime(truncating: endFrame))
            } else {
                view.play()
            }
        }
    }

    @objc(reset:)
    public func reset(_ reactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? ContainerView else {
                if RCT_DEBUG == 1 {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.reset()
        }
    }

    @objc(pause:)
    public func pause(_ reactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? ContainerView else {
                if RCT_DEBUG == 1 {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.pause()
        }
    }

    @objc(resume:)
    public func resume(_ reactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? ContainerView else {
                if RCT_DEBUG == 1 {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.resume()
        }
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
