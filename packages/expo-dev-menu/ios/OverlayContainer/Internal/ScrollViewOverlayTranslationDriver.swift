//  Copyright (c) 2018, Applidium. All rights reserved
//  ScrollViewOverlayTranslationDriver.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 29/11/2018.
//

import UIKit

class ScrollViewOverlayTranslationDriver: OverlayTranslationDriver, OverlayScrollViewDelegate {

    weak var translationController: OverlayTranslationController?
    weak var scrollView: UIScrollView?

    private let scrollViewDelegateProxy = OverlayScrollViewDelegateProxy()

    // (gz) 2018-11-27 The overlay transaction is not always equal to the scroll view translation.
    // The user can scroll bottom then drag the overlay up repeatedly in a single gesture.
    private var overlayTranslation: CGFloat = 0
    private var scrollViewTranslation: CGFloat = 0
    private var lastContentOffsetWhileScrolling: CGPoint = .zero

    // MARK: - Life Cycle

    init(translationController: OverlayTranslationController, scrollView: UIScrollView) {
        self.translationController = translationController
        self.scrollView = scrollView
        scrollViewDelegateProxy.forward(to: self, delegateInvocationsFrom: scrollView)
        lastContentOffsetWhileScrolling = scrollView.contentOffset
    }

    // MARK: - OverlayTranslationDriver

    func clean() {
        scrollViewDelegateProxy.cancelForwarding()
    }

    // MARK: - OverlayScrollViewDelegate

    func overlayScrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        translationController?.startOverlayTranslation()
    }

    func overlayScrollViewDidScroll(_ scrollView: UIScrollView) {
        guard let controller = translationController else { return }
        let previousTranslation = scrollViewTranslation
        scrollViewTranslation = scrollView.panGestureRecognizer.translation(in: scrollView).y
        if shouldDragOverlay(following: scrollView) {
            if scrollView.isContentOriginInBounds {
                overlayTranslation += -scrollView.topOffsetInContent
            } else {
                overlayTranslation += scrollViewTranslation - previousTranslation
            }
            let offset = adjustedContentOffset(dragging: scrollView)
            lastContentOffsetWhileScrolling = offset
            scrollView.contentOffset = offset // Warning : calls `overlayScrollViewDidScroll(_:)` again
            controller.dragOverlay(withOffset: overlayTranslation, usesFunction: false)
        } else {
            lastContentOffsetWhileScrolling = scrollView.contentOffset
        }
    }

    func overlayScrollView(_ scrollView: UIScrollView,
                           willEndDraggingwithVelocity velocity: CGPoint,
                           targetContentOffset: UnsafeMutablePointer<CGPoint>) {
        guard let controller = translationController else { return }
        overlayTranslation = 0
        scrollViewTranslation = 0
        // (gz) 2018-11-27 We reset the translation each time the user ends dragging.
        // Otherwise the calculation is wrong in `overlayScrollViewDidScroll(_:)`
        // if the user drags the overlay while the animation did not finish.
        scrollView.panGestureRecognizer.setTranslation(.zero, in: nil)
        // (gz) 2018-01-24 We adjust the content offset and the velocity only if the overlay will be dragged.
        switch controller.translationPosition {
        case .bottom where targetContentOffset.pointee.y > -scrollView.oc_adjustedContentInset.top:
            // (gz) 2018-11-26 The user raises its finger in the bottom position
            // and the content offset will exceed the top content inset.
            targetContentOffset.pointee.y = -scrollView.oc_adjustedContentInset.top
        case .inFlight where !controller.overlayHasReachedANotch():
            targetContentOffset.pointee.y = lastContentOffsetWhileScrolling.y
        case .top, .bottom, .inFlight, .stationary:
            break
        }
        // If the overlay is in flight and the user scrolls bottom, we ignore the velocity and we do not
        // modify the target offset.
        let adjustedVelocity: CGPoint
        if shouldDragOverlay(following: scrollView) {
            adjustedVelocity = velocity
        } else {
            adjustedVelocity = .zero
        }
        controller.endOverlayTranslation(withVelocity: adjustedVelocity)
    }

    // MARK: - Private

    private func shouldDragOverlay(following scrollView: UIScrollView) -> Bool {
        guard let controller = translationController, scrollView.isTracking else { return false }
        let velocity = scrollView.panGestureRecognizer.velocity(in: nil).y
        let movesUp = velocity < 0
        switch controller.translationPosition {
        case .bottom:
            return !scrollView.isContentOriginInBounds && scrollView.scrollsUp
        case .top:
            return scrollView.isContentOriginInBounds && !movesUp
        case .inFlight:
            return scrollView.isContentOriginInBounds || scrollView.scrollsUp
        case .stationary:
            return false
        }
    }

    private func adjustedContentOffset(dragging scrollView: UIScrollView) -> CGPoint {
        guard let controller = translationController else { return .zero }
        var contentOffset = lastContentOffsetWhileScrolling
        let topInset = -scrollView.oc_adjustedContentInset.top
        switch controller.translationPosition {
        case .inFlight, .top:
            // (gz) 2018-11-26 The user raised its finger in the top or in flight positions while scrolling bottom.
            // If the scroll animation did not finish when the user translates the overlay,
            // the content offset may have exceeded the top inset. We adjust it.
            if contentOffset.y < topInset {
                contentOffset.y = topInset
            }
        case .bottom, .stationary:
            break
        }
        // (gz) 2018-11-26 Between two `overlayScrollViewDidScroll:` calls,
        // the scrollView exceeds the top contentInset. We adjust the target.
        if (contentOffset.y - topInset) * (scrollView.contentOffset.y - topInset) < 0 {
            contentOffset.y = topInset
        }
        return contentOffset
    }
}
