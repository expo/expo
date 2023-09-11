//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayScrollViewDelegate.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 20/11/2018.
//

import UIKit

protocol OverlayScrollViewDelegate: AnyObject {
    func overlayScrollViewWillBeginDragging(_ scrollView: UIScrollView)
    func overlayScrollViewDidScroll(_ scrollView: UIScrollView)
    func overlayScrollView(_ scrollView: UIScrollView,
                           willEndDraggingwithVelocity velocity: CGPoint,
                           targetContentOffset: UnsafeMutablePointer<CGPoint>)
}
