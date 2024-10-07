//
//  NowPlayingInfo.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 15/03/2018.
//

import Foundation
import MediaPlayer


/**
 Enum representing MPNowPlayingInfoProperties.
 Docs for each property is taken from [Apple docs](https://developer.apple.com/documentation/mediaplayer/mpnowplayinginfocenter/additional_metadata_properties).
 */
public enum NowPlayingInfoProperty: NowPlayingInfoKeyValue {
    
    /**
     The identifier of the collection the now playing item belongs to.
     The identifier can be an album, artist, playlist, etc.
     */
    case collectionIdentifier(String?)
    
    /**
     The available language option groups for the now playing item.
     Value is an array of MPNowPlayingInfoLanguageOptionGroup items. Only one language option in a given group can be played at a time.
     */
    case availableLanguageOptions([MPNowPlayingInfoLanguageOptionGroup]?)
    
    /**
     The URL pointing to the now playing item's underlying asset.
     This constant is used by the system UI when video thumbnails or audio waveform visualizations are applicable.
     */
    case assetUrl(URL?)
    
    /**
     The total number of chapters in the now-playing item.
     Value is an NSNumber object configured as an NSUInteger.
     */
    case chapterCount(UInt64?)
    
    /**
     The number corresponding to the chapter currently being played.
     Value is an NSNumber object configured as an NSUInteger. Chapter numbering uses zero-based indexing. If you want the first chapter in the now-playing item to be displayed as “Chapter 1,” for example, set the chapter number to 0.
     */
    case chapterNumber(UInt64?)
    
    /**
     The currently active language options for the now playing item.
     Value is an array of MPNowPlayingInfoLanguageOption items.
     */
    case currentLanguageOptions([MPNowPlayingInfoLanguageOption]?)
    
    /**
     The default playback rate for the now playing item.
     Value is an NSNumber object configured as a double. Set this property if your app is playing a media item at a playback rate other than 1.0 as its default rate.
     */
    case defaultPlaybackRate(Double?)
    
    /**
     The elapsed time of the now playing item, in seconds.
     Value is an NSNumber object configured as a double. Elapsed time is automatically calculated, by the system, from the previously provided elapsed time and the playback rate. Do not update this property frequently—it is not necessary
     */
    case elapsedPlaybackTime(Double?)
    
    /**
     The opaque identifier that uniquely identifies the now playing item, even through app relaunches.
     This is only used to reference the item to the now playing app and can be in any format.
     */
    case externalContentIdentifier(Any?)
    
    /**
     The opaque identifier that uniquely identifies the profile the now playing item is played from, even through app relaunches.
     This is only used to reference the profile to the now playing app and can be in any format.
     */
    case externalUserProfileIdentifier(Any?)
    
    /**
     Denotes whether the now playing item is a live stream.
     Value is an NSNumber object configured as a boolean. A value of 1.0 indicates the now playing item is a live stream.
     */
    case isLiveStream(Bool?)
    
    /**
     The media type of the now playing item.
     Value is an NSNumber object configured as a MPNowPlayingInfoMediaType.
     */
    case mediaType(MPNowPlayingInfoMediaType?)
    
    /**
     The current progress of the now playing item.
     Value is an NSNumber object configured as a float. A value of 0.0 indicates the item has not been watched while a value of 1.0 indicates the item has been fully watched. This is a high-level indicator. Use MPNowPlayingInfoPropertyElapsedPlaybackTime for fine-detailed information on how much of the item has been watched.
     */
    case playbackProgress(Float?)
    
    /**
     The total number of items in the app’s playback queue.
     Value is an NSNumber object configured as an NSUInteger.
     */
    case playbackQueueCount(UInt64?)
    
    /**
     The index of the now-playing item in the app’s playback queue.
     Value is an NSNumber object configured as an NSUInteger. The playback queue uses zero-based indexing. If you want the first item in the queue to be displayed as “item 1 of 10,” for example, set the item’s index to 0.
     */
    case playbackQueueIndex(UInt64?)
    
    /**
     The playback rate of the now-playing item, with a value of 1.0 indicating the normal playback rate.
     Value is an NSNumber object configured as a double. The default value is 1.0. A playback rate value of 2.0 means twice the normal playback rate; a piece of media played at this rate would take half as long to play to completion. A value of 0.5 means half the normal playback rate; a piece of media played at this rate would take twice as long to play to completion.
     */
    case playbackRate(Double?)
    
    /**
     The service provider associated with the now-playing item.
     Value is a unique NSString that identifies the service provider for the now-playing item. If the now-playing item belongs to a channel or subscription service, this key can be used to coordinate various types of now-playing content from the service provider.
     */
    case serviceIdentifier(String?)
    
    
    public func getKey() -> String {
        switch self {
            
        case .collectionIdentifier(_):
            return MPNowPlayingInfoCollectionIdentifier
            
        case .availableLanguageOptions(_):
            return MPNowPlayingInfoPropertyAvailableLanguageOptions
            
        case .assetUrl(_):
            return MPNowPlayingInfoPropertyAssetURL
        case .chapterCount(_):
            return MPNowPlayingInfoPropertyChapterCount
            
        case .chapterNumber(_):
            return MPNowPlayingInfoPropertyChapterNumber
            
        case .currentLanguageOptions(_):
            return MPNowPlayingInfoPropertyCurrentLanguageOptions
            
        case .defaultPlaybackRate(_):
            return MPNowPlayingInfoPropertyDefaultPlaybackRate
            
        case .elapsedPlaybackTime(_):
            return MPNowPlayingInfoPropertyElapsedPlaybackTime
            
        case .externalContentIdentifier(_):
            return MPNowPlayingInfoPropertyExternalContentIdentifier
            
        case .externalUserProfileIdentifier(_):
            return MPNowPlayingInfoPropertyExternalUserProfileIdentifier
            
        case .isLiveStream(_):
            return MPNowPlayingInfoPropertyIsLiveStream
            
        case .mediaType(_):
            return MPNowPlayingInfoPropertyMediaType
            
        case .playbackProgress(_):
            return MPNowPlayingInfoPropertyPlaybackProgress
            
        case .playbackQueueCount(_):
            return MPNowPlayingInfoPropertyPlaybackQueueCount
            
        case .playbackQueueIndex(_):
            return MPNowPlayingInfoPropertyPlaybackQueueIndex
            
        case .playbackRate(_):
            return MPNowPlayingInfoPropertyPlaybackRate
            
        case .serviceIdentifier(_):
            return MPNowPlayingInfoPropertyServiceIdentifier
            
        }
    }
    
    public func getValue() -> Any? {
        switch self {
            
        case .collectionIdentifier(let identifier):
            return identifier
            
        case .availableLanguageOptions(let options):
            return options
            
        case .assetUrl(let url):
            return url
            
        case .chapterCount(let count):
            return count != nil ? NSNumber(value: count!) : nil
            
        case .chapterNumber(let number):
            return number != nil ? NSNumber(value: number!) : nil
            
        case .currentLanguageOptions(let options):
            return options
            
        case .defaultPlaybackRate(let rate):
            return rate != nil ? NSNumber(floatLiteral: rate!) : nil
            
        case .elapsedPlaybackTime(let time):
            return time != nil ? NSNumber(floatLiteral: time!) : nil
            
        case .externalContentIdentifier(let id):
            return id
            
        case .externalUserProfileIdentifier(let id):
            return id
            
        case .isLiveStream(let status):
            return status
            
        case .mediaType(let type):
            return type != nil ? NSNumber(value: type!.rawValue) : nil
            
        case .playbackProgress(let progress):
            return progress != nil ? NSNumber(value: progress!) : nil
            
        case .playbackQueueCount(let count):
            return count != nil ? NSNumber(value: count!) : nil
            
        case .playbackQueueIndex(let index):
            return index != nil ? NSNumber(value: index!) : nil
            
        case .playbackRate(let rate):
            return rate != nil ? NSNumber(floatLiteral: rate!) : nil
            
        case .serviceIdentifier(let id):
            return id != nil ? NSString(string: id!) : nil
            
        }
    }
    
}
