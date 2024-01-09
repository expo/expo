import Lottie
import Foundation

@objc protocol LottieContainerViewDelegate {
    func onAnimationFinish(isCancelled: Bool)
    func onAnimationFailure(error: String)
    func onAnimationLoaded()
}

/* There are Two Views being implemented here:
 1- The RCTView for React Native that has all of the normal props, and
 2- a LottieAnimationView that is a child of the RCTView and is bound to the same coordinates, just on top of it
 */
@objc(LottieContainerView)
class ContainerView: RCTView {
    private var speed: CGFloat = 0.0
    private var progress: CGFloat = 0.0
    private var autoPlay: Bool = false
    private var loop: LottieLoopMode = .playOnce
    private var sourceJson: String = ""
    private var resizeMode: String = ""
    private var sourceName: String = ""
    private var colorFilters: [NSDictionary] = []
    private var textFilters: [NSDictionary] = []
    private var renderMode: RenderingEngineOption = .automatic
    @objc weak var delegate: LottieContainerViewDelegate?
    var animationView: LottieAnimationView?
    @objc var onAnimationFinish: RCTBubblingEventBlock?
    @objc var onAnimationFailure: RCTBubblingEventBlock?
    @objc var onAnimationLoaded: RCTBubblingEventBlock?

    @objc var completionCallback: LottieCompletionBlock {
        return { [weak self] animationFinished in
            guard let self = self else { return }

            if let onFinish = self.onAnimationFinish {
                onFinish(["isCancelled": !animationFinished])
            }

            self.delegate?.onAnimationFinish(isCancelled: !animationFinished)
        }
    }

    @objc var failureCallback: (_ error: String) -> Void {
        return { [weak self] error in
            guard let self = self else { return }

            if let onFinish = self.onAnimationFailure {
                onFinish(["error": error])
            }

            self.delegate?.onAnimationFailure(error: error)
        }
    }

    @objc var loadedCallback: () -> Void {
        return { [weak self] in
            guard let self = self else { return }

            if let onLoaded = self.onAnimationLoaded {
                onLoaded([:])
            }

            self.delegate?.onAnimationLoaded()
        }
    }

#if !(os(OSX))
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if #available(iOS 13.0, tvOS 13.0, *) {
            if self.traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) {
                if !colorFilters.isEmpty {
                    applyColorProperties()
                }
            }
        }
    }
#endif

    @objc func setSpeed(_ newSpeed: CGFloat) {
        speed = newSpeed

        if newSpeed != 0.0 {
            animationView?.animationSpeed = newSpeed
            if !(animationView?.isAnimationPlaying ?? true) {
                animationView?.play()
            }
        } else if animationView?.isAnimationPlaying ?? false {
            animationView?.pause()
        }
    }

    @objc func setProgress(_ newProgress: CGFloat) {
        progress = newProgress
        animationView?.currentProgress = progress
    }

    @objc func setLoop(_ isLooping: Bool) {
        loop = isLooping ? .loop : .playOnce
        animationView?.loopMode = loop
    }

    @objc func setAutoPlay(_ autoPlay: Bool) {
        self.autoPlay = autoPlay
        playIfNeeded()
    }

    @objc func setTextFiltersIOS(_ newTextFilters: [NSDictionary]) {
        textFilters = newTextFilters

        if textFilters.count > 0 {
            var filters = [String: String]()
            for filter in textFilters {
                guard let key = filter.value(forKey: "keypath") as? String,
                      let value = filter.value(forKey: "text") as? String else { break }
                filters[key] = value
            }

            let nextAnimationView = LottieAnimationView(
                animation: animationView?.animation,
                configuration: lottieConfiguration
            )
            nextAnimationView.textProvider = DictionaryTextProvider(filters)
            replaceAnimationView(next: nextAnimationView)
        }
    }

    var lottieConfiguration: LottieConfiguration {
        return LottieConfiguration(
            renderingEngine: renderMode
        )
    }

    @objc func setRenderMode(_ newRenderMode: String) {
        switch newRenderMode {
        case "SOFTWARE":
            if renderMode == .mainThread {
                return
            }
            renderMode = .mainThread
        case "HARDWARE":
            if renderMode == .coreAnimation {
                return
            }
            renderMode = .coreAnimation
        default:
            if renderMode == .automatic {
                return
            }
            renderMode = .automatic
        }

        if animationView != nil {
            let nextAnimationView = LottieAnimationView(
                animation: animationView?.animation,
                configuration: lottieConfiguration
            )

            replaceAnimationView(next: nextAnimationView)
        }
    }

    @objc func setSourceDotLottieURI(_ uri: String) {
        if checkReactSourceString(uri) {
            return
        }

        guard let url = URL(string: uri) else {
            return
        }

        _ = LottieAnimationView(
            dotLottieUrl: url,
            configuration: lottieConfiguration,
            completion: { [weak self] view, error in
                guard let self = self else { return }
                if let error = error {
                    self.failureCallback(error.localizedDescription)
                    return
                }
                self.replaceAnimationView(next: view)
            }
        )
    }

    @objc func setSourceURL(_ newSourceURLString: String) {
        if checkReactSourceString(newSourceURLString) {
            return
        }

        var url = URL(string: newSourceURLString)

        if url?.scheme == nil {
            // interpret raw URL paths as relative to the resource bundle
            url = URL(fileURLWithPath: newSourceURLString, relativeTo: Bundle.main.resourceURL)
        }

        guard let url = url else { return }

        self.fetchRemoteAnimation(from: url)
    }

    @objc func setSourceJson(_ newSourceJson: String) {
        if checkReactSourceString(newSourceJson) {
            return
        }

        sourceJson = newSourceJson

        guard let data = sourceJson.data(using: String.Encoding.utf8),
              let animation = try? JSONDecoder().decode(LottieAnimation.self, from: data) else {
            failureCallback("Unable to create the lottie animation object from the JSON source")
            return
        }

        let nextAnimationView = LottieAnimationView(
            animation: animation,
            configuration: lottieConfiguration
        )

        replaceAnimationView(next: nextAnimationView)
    }

    @objc func setSourceName(_ newSourceName: String) {
        if checkReactSourceString(newSourceName) {
            return
        }

        if newSourceName == sourceName {
            return
        }

        sourceName = newSourceName

        let nextAnimationView = LottieAnimationView(
            name: sourceName,
            configuration: lottieConfiguration
        )

        replaceAnimationView(next: nextAnimationView)
    }

    @objc func setResizeMode(_ resizeMode: String) {
        self.resizeMode = resizeMode
        applyContentMode()
    }

    @objc func setColorFilters(_ newColorFilters: [NSDictionary]) {
        colorFilters = newColorFilters
        applyColorProperties()
    }

    // There is no Nullable CGFloat in Objective-C, so this function uses a Nullable NSNumber and converts it later
    @objc(playFromFrame:toFrame:)
    func objcCompatiblePlay(fromFrame: NSNumber? = nil, toFrame: AnimationFrameTime) {
        let convertedFromFrame = fromFrame != nil ? CGFloat(truncating: fromFrame!) : nil
        play(fromFrame: convertedFromFrame, toFrame: toFrame)
    }

    func play(fromFrame: AnimationFrameTime? = nil, toFrame: AnimationFrameTime) {
        animationView?.play(fromFrame: fromFrame, toFrame: toFrame, loopMode: self.loop, completion: completionCallback)
    }

    @objc func play() {
        animationView?.play(completion: completionCallback)
    }

    @objc func reset() {
        animationView?.currentProgress = 0
        animationView?.pause()
    }

    @objc func pause() {
        animationView?.pause()
    }

    @objc func resume() {
        play()
    }

    // The animation view is a child of the RCTView, so if the bounds ever change, add those changes to the animation view as well
    override func layoutSubviews() {
        super.layoutSubviews()
        animationView?.frame = self.bounds
    }

    // MARK: Private
    func replaceAnimationView(next: LottieAnimationView) {
        super.removeReactSubview(animationView)

        animationView = next

        animationView?.backgroundBehavior = .pauseAndRestore
        animationView?.animationSpeed = speed
        animationView?.loopMode = loop
        animationView?.frame = self.bounds

        addSubview(next)

        applyContentMode()
        applyColorProperties()
        playIfNeeded()

        animationView?.animationLoaded = { [weak self] _, _ in
            guard let self = self else { return }
            self.loadedCallback()
        }
    }

    func applyContentMode() {
        guard let animationView = animationView else { return }

        switch resizeMode {
        case "cover":
            animationView.contentMode = .scaleAspectFill
        case "contain":
            animationView.contentMode = .scaleAspectFit
        case "center":
            animationView.contentMode = .center
        default: break
        }
    }

    func applyColorProperties() {
        guard let animationView = animationView else { return }

        if colorFilters.count > 0 {
            for filter in colorFilters {
                guard let key = filter.value(forKey: "keypath") as? String,
                      let platformColor = filter.value(forKey: "color") as? PlatformColor else { break }
                let keypath: String = "\(key).**.Color"
                let fillKeypath = AnimationKeypath(keypath: keypath)
                let colorFilterValueProvider = ColorValueProvider(platformColor.lottieColorValue)
                animationView.setValueProvider(colorFilterValueProvider, keypath: fillKeypath)
            }
        }
    }

    func playIfNeeded() {
        if autoPlay && animationView?.isAnimationPlaying == false {
            self.play()
        }
    }

    private func checkReactSourceString(_ sourceStr: String?) -> Bool {
        guard let sourceStr = sourceStr else {
            return false
        }

        return sourceStr.isEmpty
    }

    private func fetchRemoteAnimation(from url: URL) {
        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            guard let self = self else { return }

            if let error = error {
                self.failureCallback("Unable to fetch the Lottie animation from the URL: \(error.localizedDescription)")
                return
            }

            guard let data = data else {
                self.failureCallback("No data received for the Lottie animation from the URL.")
                return
            }

            do {
                let animation = try JSONDecoder().decode(LottieAnimation.self, from: data)

                DispatchQueue.main.async { [weak self] in
                    guard let self = self else { return }

                    let nextAnimationView = LottieAnimationView(
                        animation: animation,
                        configuration: self.lottieConfiguration
                    )

                    self.replaceAnimationView(next: nextAnimationView)
                }
            } catch {
                self.failureCallback("Unable to decode the Lottie animation object from the fetched URL source: \(error.localizedDescription)")
            }
        }.resume()
    }
}
