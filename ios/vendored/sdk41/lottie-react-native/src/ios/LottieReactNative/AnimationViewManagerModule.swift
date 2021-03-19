#if canImport(ABI41_0_0React)
import ABI41_0_0React
#endif

import Lottie

@objc(ABI41_0_0LottieAnimationView)
class AnimationViewManagerModule: ABI41_0_0RCTViewManager {
    override func view() -> UIView! {
        return ContainerView()
    }
    
    @objc override func constantsToExport() -> [AnyHashable : Any]! {
        return ["VERSION": 1]
    }
    
    
    @objc(ABI41_0_0play:fromFrame:toFrame:)
    public func play(_ ABI41_0_0ReactTag: NSNumber, startFrame: NSNumber, endFrame: NSNumber) {
        
        self.bridge.uiManager.addUIBlock { (uiManager, viewRegistry) in
            guard let view = viewRegistry?[ABI41_0_0ReactTag] as? ContainerView else {
                if (ABI41_0_0RCT_DEV == 1) {
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
    
    @objc(ABI41_0_0reset:)
    public func reset(_ ABI41_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[ABI41_0_0ReactTag] as? ContainerView else {
                if (ABI41_0_0RCT_DEV == 1) {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.reset()
        }
    }
    
    @objc(ABI41_0_0pause:)
    public func pause(_ ABI41_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[ABI41_0_0ReactTag] as? ContainerView else {
                if (ABI41_0_0RCT_DEV == 1) {
                    print("Invalid view returned from registry, expecting ContainerView")
                }
                return
            }

            view.pause()
        }
    }

    @objc(ABI41_0_0resume:)
    public func resume(_ ABI41_0_0ReactTag: NSNumber) {
        self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[ABI41_0_0ReactTag] as? ContainerView else {
                if (ABI41_0_0RCT_DEV == 1) {
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
