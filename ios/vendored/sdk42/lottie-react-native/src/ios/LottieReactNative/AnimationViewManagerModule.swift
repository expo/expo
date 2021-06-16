import Lottie

#if os(OSX)
import AppKit

typealias View = NSView

#else
import UIKit

typealias View = UIView

#endif

@objc(ABI42_0_0LottieAnimationView)
class AnimationViewManagerModule: ABI42_0_0RCTViewManager {
    override func view() -> View! {
        return ContainerView()
    }

    @objc override func constantsToExport() -> [AnyHashable : Any]! {
        return ["VERSION": 1]
    }


    @objc(play:fromFrame:toFrame:)
    public func play(_ abi42_0_0ReactTag: NSNumber, startFrame: NSNumber, endFrame: NSNumber) {
        self.bridge.uiManager.addUIBlock { (uiManager, viewRegistry) in
            guard let view = viewRegistry?[abi42_0_0ReactTag] as? ContainerView else {
                if (ABI42_0_0RCT_DEBUG == 1) {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            let callback: LottieCompletionBlock = { animationFinished in
                if let onFinish = view.onAnimationFinish {
                    onFinish(["isCancelled": !animationFinished])
                }
            }

            if (startFrame.intValue != -1 && endFrame.intValue != -1) {
                view.play(fromFrame: AnimationFrameTime(truncating: startFrame), toFrame: AnimationFrameTime(truncating: endFrame), completion: callback)
            } else {
                view.play(completion: callback)
            }
        }
    }

    @objc(reset:)
    public func reset(_ abi42_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[abi42_0_0ReactTag] as? ContainerView else {
                if (ABI42_0_0RCT_DEBUG == 1) {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.reset()
        }
    }

    @objc(pause:)
    public func pause(_ abi42_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[abi42_0_0ReactTag] as? ContainerView else {
                if (ABI42_0_0RCT_DEBUG == 1) {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.pause()
        }
    }

    @objc(resume:)
    public func resume(_ abi42_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[abi42_0_0ReactTag] as? ContainerView else {
                if (ABI42_0_0RCT_DEBUG == 1) {
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
