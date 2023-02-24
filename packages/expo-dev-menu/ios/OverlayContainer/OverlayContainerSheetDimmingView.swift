//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayContainerPresentationDimmingView.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 08/04/2020.
//

import UIKit

/// An interface that enables a view to coordinate its appearance change alongside the container presentation animations and the presented overlay translations.
public protocol OverlayContainerSheetDimmingView: UIView {
    /// Notifies the view that the presentation animations are about to start.
    func presentationTransitionWillBegin()
    /// Notifies the view that the presentation animations starts. This method is called in an animation block.
    func presentationTransitionDidBegin()
    /// Notifies the view that the dismissal animations are about to start.
    func dismissalTransitionWillBegin()
    /// Notifies the view that the dismissal animations starts. This method is called in an animation block.
    func dismissalTransitionDidBegin()
    /// Notifies the view that a presented overlay is about to be moved. This method is called in an animation block.
    ///
    /// - parameter context: The context object containing information about the current overlay container state.
    func overlayViewControllerWillTranslate(context: OverlayContainerTransitionCoordinatorContext)
}

public extension OverlayContainerSheetDimmingView {
    func presentationTransitionWillBegin() {}
    func presentationTransitionDidBegin() {}
    func dismissalTransitionWillBegin() {}
    func dismissalTransitionDidBegin() {}
    func overlayViewControllerWillTranslate(context: OverlayContainerTransitionCoordinatorContext) {}
}

/// An `OverlayContainerSheetDimmingView` class that coordinates its alpha value alongside the container presentation animations
/// and the presented overlay translations.
open class TransparentOverlayContainerSheetDimmingView: UIView, OverlayContainerSheetDimmingView {

    /// The view alpha when the container is dismissed.
    open var dismissedAlpha: CGFloat = 0.0
    /// The view alpha when the overlay reaches its minimum notch.
    open var minimumAlpha: CGFloat = 0.3
    /// The view alpha when the overlay reaches its maximum notch.
    open var maximumAlpha: CGFloat = 0.6

    // MARK: - Life Cycle

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    public required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        setUp()
    }

    // MARK: - OverlayContainerSheetDimmingView

    open func presentationTransitionWillBegin() {
        alpha = dismissedAlpha
    }

    open func presentationTransitionDidBegin() {
        alpha = minimumAlpha
    }

    public func dismissalTransitionDidBegin() {
        alpha = dismissedAlpha
    }

    public func overlayViewControllerWillTranslate(context: OverlayContainerTransitionCoordinatorContext) {
        let target = minimumAlpha + context.translationProgress() * (maximumAlpha - minimumAlpha)
        alpha = max(min(target, 1.0), 0)
    }

    // MARK: - Private

    private func setUp() {
        backgroundColor = .black
    }
}
