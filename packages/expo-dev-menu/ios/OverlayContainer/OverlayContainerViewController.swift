//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayViewController.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 12/11/2018.
//

import UIKit

/// A `OverlayContainerViewController` is a container view controller that manages one or more
/// child view controllers in an overlay interface.
///
/// It defines an area where a view controller, called the overlay view controller,
/// can be dragged up and down, hiding or revealing the content underneath it.
///
/// OverlayContainer uses the last view controller of its viewControllers as the overlay view controller.
/// It stacks the other view controllers on top of each other, if any, and adds them underneath the overlay view controller.
open class OverlayContainerViewController: UIViewController {

    /// `OverlayStyle` defines how the overlay view controller will be constrained in the container.
    public enum OverlayStyle {
        /// The overlay view controller will not be height-constrained. It will grow and shrink
        /// as the user drags it up and down.
        case flexibleHeight
        /// The overlay view controller will be constrained with a height equal to the highest notch.
        /// It will be fully visible only when the user has drag it up to this notch.
        case rigid
        /// The overlay view controller will be constrained with a height greater or equal to the highest notch.
        /// Its height will be expanded if the overlay goes beyond the highest notch.
        case expandableHeight
    }

    /// The delegate of the container.
    weak open var delegate: OverlayContainerViewControllerDelegate? {
        set {
            configuration.delegate = newValue
            configuration.invalidateOverlayMetrics()
            setNeedsOverlayContainerHeightUpdate()
        }
        get {
            return configuration.delegate
        }
    }

    /// The view controllers displayed.
    open var viewControllers: [UIViewController] = [] {
        didSet {
            guard isViewLoaded else { return }
            oldValue.forEach { removeChild($0) }
            loadOverlayViews()
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    /// The overlay view controller
    open var topViewController: UIViewController? {
        return viewControllers.last
    }

    open override var childForStatusBarStyle: UIViewController? {
        return topViewController
    }

    /// The scroll view managing the overlay translation.
    weak open var drivingScrollView: UIScrollView? {
        didSet {
            guard drivingScrollView !== oldValue else { return }
            guard isViewLoaded else { return }
            loadTranslationDrivers()
        }
    }

    /// The height of the area where the overlay view controller can be dragged up and down.
    /// It will only be valid once the container view is laid out or in the delegate callbacks.
    open var availableSpace: CGFloat {
        return view.frame.height
    }

    /// The style of the container.
    public let style: OverlayStyle

    private lazy var overlayPanGesture: OverlayTranslationGestureRecognizer = self.makePanGesture()
    private lazy var overlayContainerView = OverlayContainerView()
    private lazy var overlayTranslationView = OverlayTranslationView()
    private lazy var overlayTranslationContainerView = OverlayTranslationContainerView()
    private lazy var groundView = GroundView()

    private var overlayContainerViewStyleConstraint: NSLayoutConstraint?
    private var translationHeightConstraint: NSLayoutConstraint?

    private lazy var configuration = makeConfiguration()

    private var needsOverlayContainerHeightUpdate = true

    private var previousSize: CGSize = .zero
    private var translationController: HeightConstraintOverlayTranslationController?
    private var translationDrivers: [OverlayTranslationDriver] = []

    // (gz) 2020-08-11 Uses to determine whether we can safely call `presentationController` or not.
    // See issue #72
    private var isPresentedInsideAnOverlayContainerPresentationController = false

    // MARK: - Life Cycle

    /// Creates an instance with the specified `style`.
    ///
    /// - parameter style: The style used by the container. The default value is `expandableHeight`.
    ///
    /// - returns: The new `OverlayContainerViewController` instance.
    public init(style: OverlayStyle = .expandableHeight) {
        self.style = style
        super.init(nibName: nil, bundle: nil)
    }

    public required init?(coder aDecoder: NSCoder) {
        self.style = .flexibleHeight
        super.init(coder: aDecoder)
    }

    // MARK: - UIViewController

    open override func loadView() {
        view = PassThroughView()
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        loadContainerViews()
        loadOverlayViews()
    }

    open override func viewDidLoad() {
        super.viewDidLoad()
        setUpPanGesture()
    }

    open override func viewWillLayoutSubviews() {
        // (gz) 2019-06-10 According to the documentation, the default implementation of
        // `viewWillLayoutSubviews` does nothing.
        // Nethertheless in its `Changing Constraints` Guide, Apple recommends to call it.
        defer {
            super.viewWillLayoutSubviews()
        }
        let hasNewHeight = previousSize.height != view.bounds.size.height
        let hasPendingTranslation = translationController?.hasPendingTranslation() == true
        guard needsOverlayContainerHeightUpdate || hasNewHeight else { return }
        needsOverlayContainerHeightUpdate = false
        previousSize = view.bounds.size
        if hasNewHeight {
            configuration.invalidateOverlayMetrics()
        }
        if hasNewHeight && !hasPendingTranslation {
            translationController?.scheduleOverlayTranslation(
                .toLastReachedNotchIndex,
                velocity: .zero,
                animated: false
            )
        }
        configuration.requestOverlayMetricsIfNeeded()
        performDeferredTranslations()
    }

    // MARK: - Internal

    func overlayContainerPresentationTransitionWillBegin() {
        isPresentedInsideAnOverlayContainerPresentationController = true
    }

    func overlayContainerDismissalTransitionDidEnd() {
        isPresentedInsideAnOverlayContainerPresentationController = false
    }

    // MARK: - Public

    /// Moves the overlay view controller to the specified notch.
    ///
    /// - parameter index: The index of the target notch.
    /// - parameter animated: Defines either the transition should be animated or not.
    /// - parameter completion: The block to execute after the translation finishes.
    ///   This block has no return value and takes no parameters. You may specify nil for this parameter.
    ///
    open func moveOverlay(toNotchAt index: Int, animated: Bool, completion: (() -> Void)? = nil) {
        loadViewIfNeeded()
        translationController?.scheduleOverlayTranslation(
            .toIndex(index),
            velocity: .zero,
            animated: animated,
            completion: completion
        )
        setNeedsOverlayContainerHeightUpdate()
    }

    /// Invalidates the current container notches.
    ///
    /// This method does not reload the notch heights immediately. The changes are scheduled to the next layout pass.
    /// By default, the overlay container will use its target notch policy to determine where to go
    /// and animates the translation.
    /// Use `moveOverlay(toNotchAt:animated:completion:)` to override this behavior.
    ///
    open func invalidateNotchHeights() {
        guard isViewLoaded else { return }
        configuration.invalidateOverlayMetrics()
        translationController?.scheduleOverlayTranslation(
            .basedOnTargetPolicy,
            velocity: .zero,
            animated: true
        )
        setNeedsOverlayContainerHeightUpdate()
    }

    // MARK: - Private

    private func loadContainerViews() {
        view.addSubview(groundView)
        groundView.pinToSuperview()
        view.addSubview(overlayTranslationContainerView)
        overlayTranslationContainerView.pinToSuperview()
        overlayTranslationContainerView.addSubview(overlayTranslationView)
        overlayTranslationView.addSubview(overlayContainerView)
        overlayTranslationView.pinToSuperview(edges: [.bottom, .left, .right])
        overlayContainerView.pinToSuperview(edges: [.left, .top, .right])
        translationHeightConstraint = overlayTranslationView.heightAnchor.constraint(equalToConstant: 0)
        switch style {
        case .flexibleHeight:
            overlayContainerViewStyleConstraint = overlayContainerView.bottomAnchor.constraint(
                equalTo: overlayTranslationView.bottomAnchor
            )
        case .rigid:
            overlayContainerViewStyleConstraint = overlayContainerView.heightAnchor.constraint(
                equalToConstant: 0
            )
        case .expandableHeight:
            overlayContainerViewStyleConstraint = overlayContainerView.heightAnchor.constraint(
                equalToConstant: 0
            )
            overlayContainerViewStyleConstraint?.priority = .defaultHigh
            let bottomConstraint = overlayContainerView.bottomAnchor.constraint(
                greaterThanOrEqualTo: overlayTranslationView.bottomAnchor
            )
            bottomConstraint.isActive = true
        }
        loadTranslationController()
    }

    private func loadTranslationController() {
        guard let translationHeightConstraint = translationHeightConstraint else { return }
        translationController = HeightConstraintOverlayTranslationController(
            translationHeightConstraint: translationHeightConstraint,
            configuration: configuration
        )
        translationController?.delegate = self
        translationController?.scheduleOverlayTranslation(
            .toIndex(0),
            velocity: .zero,
            animated: false
        )
    }

    private func loadOverlayViews() {
        guard !viewControllers.isEmpty else { return }
        groundView.isHidden = viewControllers.count == 1
        var truncatedViewControllers = viewControllers
        truncatedViewControllers.popLast().flatMap { addChild($0, in: overlayContainerView) }
        truncatedViewControllers.forEach { addChild($0, in: groundView) }
        loadTranslationDrivers()
    }

    private func loadTranslationDrivers() {
        guard let translationController = translationController,
            let overlayController = topViewController else {
                return
        }
        translationDrivers.forEach { $0.clean() }
        translationDrivers.removeAll()
        var drivers: [OverlayTranslationDriver] = []
        let panGestureDriver = PanGestureOverlayTranslationDriver(
            translationController: translationController,
            panGestureRecognizer: overlayPanGesture
        )
        drivers.append(panGestureDriver)
        let scrollView = drivingScrollView ?? configuration.scrollView(drivingOverlay: overlayController)
        if let scrollView = scrollView {
            overlayPanGesture.drivingScrollView = scrollView
            let driver = ScrollViewOverlayTranslationDriver(
                translationController: translationController,
                scrollView: scrollView
            )
            drivers.append(driver)
        }
        translationDrivers = drivers
    }

    private func setNeedsOverlayContainerHeightUpdate() {
        needsOverlayContainerHeightUpdate = true
        viewIfLoaded?.setNeedsLayout()
    }

    private func updateOverlayContainerConstraints() {
        switch style {
        case .flexibleHeight:
            overlayContainerViewStyleConstraint?.constant = 0
        case .rigid, .expandableHeight:
            overlayContainerViewStyleConstraint?.constant = configuration.maximumNotchHeight
        }
        translationHeightConstraint?.isActive = true
        overlayContainerViewStyleConstraint?.isActive = true
    }

    private func performDeferredTranslations() {
        translationController?.performDeferredTranslations()
    }

    private func setUpPanGesture() {
        view.addGestureRecognizer(overlayPanGesture)
    }

    private func makeConfiguration() -> OverlayContainerConfigurationImplementation {
        return OverlayContainerConfigurationImplementation(
            overlayContainerViewController: self
        )
    }

    private func makePanGesture() -> OverlayTranslationGestureRecognizer {
        return OverlayTranslationGestureRecognizer()
    }
}

extension OverlayContainerViewController: HeightConstraintOverlayTranslationControllerDelegate {

    private var overlayPresentationController: OverlayContainerPresentationController? {
        guard isPresentedInsideAnOverlayContainerPresentationController else { return nil }
        return oc_findPresentationController(OverlayContainerPresentationController.self)
    }

    // MARK: - HeightOverlayTranslationControllerDelegate

    func translationController(_ translationController: OverlayTranslationController,
                               didMoveOverlayToNotchAt index: Int) {
        guard let controller = topViewController else { return }
        delegate?.overlayContainerViewController(self, didMoveOverlay: controller, toNotchAt: index)
        overlayPresentationController?.overlayContainerViewController(
            self,
            didMoveOverlay: controller,
            toNotchAt: index
        )
    }

    func translationController(_ translationController: OverlayTranslationController,
                               willMoveOverlayToNotchAt index: Int) {
        guard let controller = topViewController else { return }
        delegate?.overlayContainerViewController(self, willMoveOverlay: controller, toNotchAt: index)
        overlayPresentationController?.overlayContainerViewController(
            self,
            willMoveOverlay: controller,
            toNotchAt: index
        )
    }

    func translationControllerWillStartDraggingOverlay(_ translationController: OverlayTranslationController) {
        guard let controller = topViewController else { return }
        delegate?.overlayContainerViewController(
            self,
            willStartDraggingOverlay: controller
        )
        overlayPresentationController?.overlayContainerViewController(
            self,
            willStartDraggingOverlay: controller
        )
    }

    func translationController(_ translationController: OverlayTranslationController,
                               willEndDraggingAtVelocity velocity: CGPoint) {
        guard let controller = topViewController else { return }
        delegate?.overlayContainerViewController(
            self,
            willEndDraggingOverlay: controller,
            atVelocity: velocity
        )
        overlayPresentationController?.overlayContainerViewController(
            self,
            willEndDraggingOverlay: controller,
            atVelocity: velocity
        )
    }

    func translationController(_ translationController: OverlayTranslationController,
                               willTranslateOverlayWith transitionCoordinator: OverlayContainerTransitionCoordinator) {
        guard let controller = topViewController else { return }
        if transitionCoordinator.isAnimated {
            overlayTranslationContainerView.layoutIfNeeded()
        }
        transitionCoordinator.animate(alongsideTransition: { [weak self] context in
            self?.updateOverlayContainerConstraints()
            self?.overlayTranslationContainerView.layoutIfNeeded()
        }, completion: nil)
        delegate?.overlayContainerViewController(
            self,
            willTranslateOverlay: controller,
            transitionCoordinator: transitionCoordinator
        )
        overlayPresentationController?.overlayContainerViewController(
            self,
            willTranslateOverlay: controller,
            transitionCoordinator: transitionCoordinator
        )
    }

    func translationControllerDidScheduleTranslations(_ translationController: OverlayTranslationController) {
        setNeedsOverlayContainerHeightUpdate()
    }

    func overlayViewController(for translationController: OverlayTranslationController) -> UIViewController? {
        return topViewController
    }
}
