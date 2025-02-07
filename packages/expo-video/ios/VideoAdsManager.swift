// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import GoogleInteractiveMediaAds

class VideoAdsManager: NSObject, IMAAdsLoaderDelegate, IMAAdsManagerDelegate {
    private var adsLoader: IMAAdsLoader = IMAAdsLoader(settings: nil)
    var adsManager: IMAAdsManager!
    var contentPlayhead: IMAAVPlayerContentPlayhead?
    var isPlayingAd: Bool = false {
        didSet {
            // Ensures the content and Ad player are syncronized
            if isPlayingAd { player?.ref.pause() }
            else { player?.ref.play() }
        }
    }
    
    weak var player: VideoPlayer? {
        didSet {
            contentPlayhead = IMAAVPlayerContentPlayhead(avPlayer: self.player!.ref)
        }
    }
    
    override init() {
        super.init()
        
        self.adsLoader.delegate = self
    }
    
    // Create an ad request with our ad tag,
    public func requestAds(adDisplayContainer: IMAAdDisplayContainer, adTagUri: String){
        let request = IMAAdsRequest(
            adTagUrl: adTagUri,
            adDisplayContainer: adDisplayContainer,
            contentPlayhead: contentPlayhead,
            userContext: nil
        )

        adsLoader.requestAds(with: request)
    }
    
    // MARK: - IMAAdsLoaderDelegate
    
    func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
      adsManager = adsLoadedData.adsManager
      adsManager?.delegate = self
      adsManager.initialize(with: nil)
        print("AdLoader successfully initialized")
    }

    func adsLoader(_ loader: IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
        print("Error loading ads: " + (adErrorData.adError.message ?? "No message"))
        self.isPlayingAd = false
    }
    
    // MARK: - IMAAdsManagerDelegate

    public func adsManager(_ adsManager: IMAAdsManager, didReceive event: IMAAdEvent) {
        print("AdsManager Event: " + event.typeString)
      // Play each ad once it has been loaded
      if event.type == IMAAdEventType.LOADED {
        adsManager.start()
      }
    }
    
    public func adsManager(_ adsManager: IMAAdsManager, didReceive error: IMAAdError) {
      // Fall back to playing content
        print("AdsManager error: " + (error.message ?? "NONE"))
        self.isPlayingAd = false
    }
    
    public func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager) {
      // Pause the content for the SDK to play ads.
        self.isPlayingAd = true
    }

    public func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager) {
      // Resume the content since the SDK is done playing ads (at least for now).
        self.isPlayingAd = false
    }
}
