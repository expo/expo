//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerSheetPresentationController.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 08/04/2020.
//

import UIKit

/// An `OverlayContainerPresentationController` subclass that can be used to manage the transition animations and the presentation of overlay containers onscreen.
///
/// It adds a dimming layer over the presenting content and changes its appearance based on the current container translations.
/// It also includes two dismissal gestures: tap-to-dismiss and drag-to-dismiss.
///
/// You can subclass this class if you need an extra level of customization.
open class OverlayContainerSheetPresentationController: OverlayContainerPresentationController {

    // MARK: - Public properties

    /// The delegate of the presentation controller.
    open weak var sheetDelegate: OverlayContainerSheetPresentationControllerDelegate?

    /// A dimming view added in the container view.
    ///
    /// The default implementation of this property returns the view you provided in the `init` method.
    open private(set) var dimmingView: OverlayContainerSheetDimmingView?

    /// The underlying gesture recognizer for tap-to-dismiss gesture.
    open private(set) lazy var dismissingTapGestureRecognizer: UITapGestureRecognizer = self.makeTapGestureRecognizer()

    // MARK: - Private properties

    private lazy var tapGestureRecognizerView: UIView = self.makeTapGestureRecognizerView()

    // MARK: - Life Cycle

    /// Initializes and returns a presentation controller for transitioning between the specified view controllers.
    ///
    /// - parameter dimmingView: The view used as a dimming view. The default value is a `TransparentOverlayContainerPresentationDimmingView` instance.
    /// - parameter presentedViewController: The view controller being presented modally.
    /// - parameter dimmingView: The view controller whose content represents the starting point of the transition.
    ///
    /// - returns: The new `OverlayContainerPresentationController` instance.
    ///
    /// The `presentedViewController` can be an overlay container or the parent view controller of an overlay container.
    public init(dimmingView: OverlayContainerSheetDimmingView? = TransparentOverlayContainerSheetDimmingView(),
                presentedViewController: UIViewController,
                presenting: UIViewController?) {
        self.dimmingView = dimmingView
        super.init(
            presentedViewController: presentedViewController,
            presenting: presenting
        )
    }

    // MARK: - OverlayContainerPresentationController

    open override func overlayContainerViewController(_ containerViewController: OverlayContainerViewController,
                                                      willTranslateOverlay overlayViewController: UIViewController,
                                                      transitionCoordinator: OverlayContainerTransitionCoordinator) {
        let dismissalContext = ConcreteOverlayContainerDismissalPolicyContext(
            context: transitionCoordinator
        )
        transitionCoordinator.animate(alongsideTransition: { [weak self] context in
            self?.dimmingView?.overlayViewControllerWillTranslate(context: context)
        }, completion: nil)
        let policy = makeDismissalPolicy()
        if !presentedViewController.isBeingDismissed && policy.shouldDismiss(using: dismissalContext) {
            presentingViewController.dismiss(animated: true, completion: nil)
        }
    }

    // MARK: - UIPresentationController

    open override func presentationTransitionWillBegin() {
        super.presentationTransitionWillBegin()
        startDimmingViewPresentationTransition()
        setUpTapGesture()
    }

    open override func dismissalTransitionWillBegin() {
        super.dismissalTransitionWillBegin()
        startDimmingViewDismissalTransition()
    }

    open override func presentationTransitionDidEnd(_ completed: Bool) {
        super.presentationTransitionDidEnd(completed)
        guard !completed else { return }
        dimmingView?.removeFromSuperview()
        tapGestureRecognizerView.removeFromSuperview()
    }

    // MARK: - Action

    @objc private func tapGestureAction(_ sender: UITapGestureRecognizer) {
        let shouldDismiss = sheetDelegate?.overlayContainerSheetPresentationControllerShouldDismissOnTap(self) ?? true
        guard shouldDismiss else { return }
        presentedViewController.dismiss(animated: true, completion: nil)
    }

    // MARK: - Private

    private func setUpTapGesture() {
        guard tapGestureRecognizerView.superview == nil,
            dismissingTapGestureRecognizer.isEnabled else {
                return
        }
        containerView?.addSubview(tapGestureRecognizerView)
        tapGestureRecognizerView.pinToSuperview()
        tapGestureRecognizerView.addGestureRecognizer(dismissingTapGestureRecognizer)
    }

    private func startDimmingViewPresentationTransition() {
        guard let dimmingView = dimmingView else { return }
        if dimmingView.superview == nil {
            containerView?.addSubview(dimmingView)
            dimmingView.pinToSuperview()
        }
        containerView?.layoutIfNeeded()
        dimmingView.presentationTransitionWillBegin()
        presentedViewController.transitionCoordinator?.animate(alongsideTransition: { _ in
            dimmingView.presentationTransitionDidBegin()
        }, completion: nil)
    }

    private func startDimmingViewDismissalTransition() {
        guard let dimmingView = dimmingView else { return }
        dimmingView.dismissalTransitionWillBegin()
        presentedViewController.transitionCoordinator?.animate(alongsideTransition: { _ in
            dimmingView.dismissalTransitionDidBegin()
        }, completion: nil)
    }

    private func makeDismissalPolicy() -> OverlayContainerSheetDismissalPolicy {
        sheetDelegate?.overlayContainerSheetDismissalPolicy(for: self) ?? ThresholdOverlayContainerSheetDismissalPolicy()
    }

    private func makeTapGestureRecognizerView() -> UIView {
        UIView()
    }

    private func makeTapGestureRecognizer() -> UITapGestureRecognizer {
        UITapGestureRecognizer(target: self, action: #selector(tapGestureAction(_:)))
    }
}

public extension OverlayContainerSheetPresentationControllerDelegate {

    func overlayContainerSheetPresentationControllerShouldDismissOnTap(_ presentationController: OverlayContainerSheetPresentationController) -> Bool {
        true
    }

    func overlayContainerSheetDismissalPolicy(for presentationController: OverlayContainerSheetPresentationController) -> OverlayContainerSheetDismissalPolicy {
        ThresholdOverlayContainerSheetDismissalPolicy()
    }
}
