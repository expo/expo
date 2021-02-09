//
//  LayerTextProvider.swift
//  lottie-ios-iOS
//
//  Created by Alexandr Goncharov on 07/06/2019.
//

import Foundation

/// Connects a LottieTextProvider to a group of text layers
final class LayerTextProvider {
    
    var textProvider: AnimationTextProvider {
        didSet {
            reloadTexts()
        }
    }
    
    fileprivate(set) var textLayers: [TextCompositionLayer]
    
    init(textProvider: AnimationTextProvider) {
        self.textProvider = textProvider
        self.textLayers = []
        reloadTexts()
    }

    func addTextLayers(_ layers: [TextCompositionLayer]) {
        textLayers += layers
    }
        
    func reloadTexts() {
        textLayers.forEach {
            $0.textProvider = textProvider
        }
    }
}
