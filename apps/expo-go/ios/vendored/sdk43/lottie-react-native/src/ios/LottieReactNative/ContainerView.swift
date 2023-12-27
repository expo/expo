import Lottie

class ContainerView: ABI43_0_0RCTView {
    private var speed: CGFloat = 0.0
    private var progress: CGFloat = 0.0
    private var loop: LottieLoopMode = .playOnce
    private var sourceJson: String = ""
    private var resizeMode: String = ""
    private var sourceName: String = ""
    private var colorFilters: [NSDictionary] = []
    @objc var onAnimationFinish: ABI43_0_0RCTBubblingEventBlock?
    var animationView: AnimationView?

    @objc func setSpeed(_ newSpeed: CGFloat) {
        speed = newSpeed

        if (newSpeed != 0.0) {
            animationView?.animationSpeed = newSpeed
            if (!(animationView?.isAnimationPlaying ?? true)) {
                animationView?.play()
            }
        } else if (animationView?.isAnimationPlaying ?? false) {
            animationView?.pause()
        }
    }

    @objc func setProgress(_ newProgress: CGFloat) {
        progress = newProgress
        animationView?.currentProgress = progress
    }

    override func abi43_0_0ReactSetFrame(_ frame: CGRect) {
        super.abi43_0_0ReactSetFrame(frame)
        animationView?.abi43_0_0ReactSetFrame(frame)
    }

    @objc func setLoop(_ isLooping: Bool) {
        loop = isLooping ? .loop : .playOnce
        animationView?.loopMode = loop
    }

    @objc func setSourceJson(_ newSourceJson: String) {
        sourceJson = newSourceJson

        guard let data = sourceJson.data(using: String.Encoding.utf8),
        let animation = try? JSONDecoder().decode(Animation.self, from: data) else {
            if (ABI43_0_0RCT_DEBUG == 1) {
                print("Unable to create the lottie animation object from the JSON source")
            }
            return
        }

        let starAnimationView = AnimationView()
        starAnimationView.animation = animation
        replaceAnimationView(next: starAnimationView)
    }

    @objc func setSourceName(_ newSourceName: String) {
        if (newSourceName == sourceName) {
          return
        }
        sourceName = newSourceName

        let starAnimationView = AnimationView(name: sourceName)
        replaceAnimationView(next: starAnimationView)
    }

    @objc func setResizeMode(_ resizeMode: String) {
        switch (resizeMode) {
        case "cover":
            animationView?.contentMode = .scaleAspectFill
        case "contain":
            animationView?.contentMode = .scaleAspectFit
        case "center":
            animationView?.contentMode = .center
        default: break
        }
    }

    @objc func setColorFilters(_ newColorFilters: [NSDictionary]) {
        colorFilters = newColorFilters
        applyProperties()
    }

    func play(fromFrame: AnimationFrameTime? = nil, toFrame: AnimationFrameTime) {
        let callback: LottieCompletionBlock = { animationFinished in
            if let onFinish = self.onAnimationFinish {
                onFinish(["isCancelled": !animationFinished])
            }
        }

        animationView?.backgroundBehavior = .pauseAndRestore
        animationView?.play(fromFrame: fromFrame, toFrame: toFrame, loopMode: self.loop, completion: callback);
    }

    func play() {
        let callback: LottieCompletionBlock = { animationFinished in
            if let onFinish = self.onAnimationFinish {
                onFinish(["isCancelled": !animationFinished])
            }
        }

        animationView?.backgroundBehavior = .pauseAndRestore
        animationView?.play(completion: callback)
    }

    func reset() {
        animationView?.currentProgress = 0;
        animationView?.pause()
    }

    func pause() {
        animationView?.pause()
    }

    func resume() {
        play()
    }

    // MARK: Private

    func replaceAnimationView(next: AnimationView) {
        animationView?.removeFromSuperview()

        let contentMode = animationView?.contentMode ?? .scaleAspectFit
        animationView = next
        addSubview(next)
        animationView?.contentMode = contentMode
        animationView?.abi43_0_0ReactSetFrame(frame)
        applyProperties()
    }

    func applyProperties() {
        animationView?.currentProgress = progress
        animationView?.animationSpeed = speed
        animationView?.loopMode = loop
        if (colorFilters.count > 0) {
            for filter in colorFilters {
                let keypath: String = "\(filter.value(forKey: "keypath") as! String).**.Color"
                let fillKeypath = AnimationKeypath(keypath: keypath)
                let colorFilterValueProvider = ColorValueProvider(hexStringToColor(hex: filter.value(forKey: "color") as! String))
                animationView?.setValueProvider(colorFilterValueProvider, keypath: fillKeypath)
            }
        }
    }
}
