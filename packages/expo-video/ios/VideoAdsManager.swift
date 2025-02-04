// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import GoogleInteractiveMediaAds

class VideoAdsManager: NSObject, IMAAdsLoaderDelegate, IMAAdsManagerDelegate {
    private var adsLoader: IMAAdsLoader
    var adsManager: IMAAdsManager!
    var contentPlayhead: IMAAVPlayerContentPlayhead?
    
    weak var player: VideoPlayer? {
        didSet {
            contentPlayhead = IMAAVPlayerContentPlayhead(avPlayer: self.player!.ref)
        }
    }
    
    
    override init() {
        self.adsLoader = IMAAdsLoader()
        super.init()
        self.adsLoader.delegate = self
    }
    
    public func requestAds(adDisplayContainer: IMAAdDisplayContainer){
        
        // Create an ad request with our ad tag, display container, and optional user context.
        let request = IMAAdsRequest(
            adTagUrl: "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
            adDisplayContainer: adDisplayContainer,
            contentPlayhead: contentPlayhead,
            userContext: nil
        )

        adsLoader.requestAds(with: request)
    }
    
    // Ensures the content and Ad player are syncronized
    func syncPlayers(isPlayingAd: Bool){
        if isPlayingAd {
            player?.ref.pause()
        } else {
            player?.ref.play()
        }
    }
    
    
    // MARK: - IMAAdsLoaderDelegate
    
    func adsLoader(_ loader: IMAAdsLoader!, adsLoadedWith adsLoadedData: IMAAdsLoadedData!) {
      adsManager = adsLoadedData.adsManager
      adsManager?.delegate = self
      adsManager.initialize(with: nil)
        print("Loaded ads")
    }

    func adsLoader(_ loader: IMAAdsLoader!, failedWith adErrorData: IMAAdLoadingErrorData!) {
        print("Error loading ads: " + (adErrorData.adError.message ?? "No message"))
        syncPlayers(isPlayingAd: false)
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
        syncPlayers(isPlayingAd: false)
    }
    
    public func adsManagerDidRequestContentPause(_ adsManager: IMAAdsManager) {
      // Pause the content for the SDK to play ads.
        syncPlayers(isPlayingAd: true)
    }

    public func adsManagerDidRequestContentResume(_ adsManager: IMAAdsManager) {
      // Resume the content since the SDK is done playing ads (at least for now).
        syncPlayers(isPlayingAd: false)
    }
}
