// @flow

import * as React from 'react';
import { EmitterSubscription } from 'fbemitter';
import { requireNativeComponent, findNodeHandle, Platform } from 'react-native';

import AdsManager from './NativeAdsManager';
import { NativeAdIconView } from './AdIconViewManager';
import { NativeMediaView } from './MediaViewManager';

const NativeAdView = requireNativeComponent('CTKNativeAd', null);

type NativeAd = {
  advertiserName: ?string,
  bodyText: ?string,
  callToActionText: ?string,
  headline: ?string,
  linkDescription: ?string,
  promotedTranslation: ?string,
  socialContext: ?string,
  sponsoredTranslation: ?string,
  translation: ?string,
};

type NativeAdWrapperState = {
  ad: ?NativeAd,
  canRequestAds: boolean,
  mediaViewNodeHandle: number,
  adIconViewNodeHandle: number,
  clickableChildren: Set<number>,
};

type NativeAdWrapperProps = {
  adsManager: AdsManager,
  onAdLoaded?: ?(?NativeAd) => void,
};

type MultipleRegisterablesContextValueType = {
  unregister: (React.Node => void) | null,
  register: (React.Node => void) | null,
};

type RegisterableContextValueType = {
  register: (React.Node => void) | null,
  unregister: (() => void) | null,
};

export type TriggerableContextValueType = MultipleRegisterablesContextValueType;
export type AdIconViewContextValueType = RegisterableContextValueType;
export type MediaViewContextValueType = RegisterableContextValueType;

/**
 * Higher order function that wraps given `Component` and provides `nativeAd` as a prop
 *
 * In case of an empty ad or adsManager not yet ready for displaying ads, null will be
 * returned instead of a component provided.
 */

const defaultValue = { register: null, unregister: null };

export const TriggerableContext = React.createContext(defaultValue);
export const MediaViewContext = React.createContext(defaultValue);
export const AdIconViewContext = React.createContext(defaultValue);

export default <T>(Component: React.ComponentType<T>) =>
  class NativeAdWrapper extends React.Component<NativeAdWrapperProps & T, NativeAdWrapperState> {
    _subscription: ?EmitterSubscription;
    _nativeAdViewRef: ?NativeAdView;
    _registerFunctionsForTriggerables: TriggerableContextValueType;
    _registerFunctionsForMediaView: MediaViewContextValueType;
    _registerFunctionsForAdIconView: AdIconViewContextValueType;
    _clickableChildrenNodeHandles: Map<React.Node, number>;

    constructor(props: NativeAdWrapperProps & T) {
      super(props);

      this._registerFunctionsForTriggerables = {
        register: this._registerClickableChild,
        unregister: this._unregisterClickableChild,
        onTriggerEvent: this._onTriggerEvent,
      };

      this._registerFunctionsForMediaView = {
        unregister: this._unregisterMediaView,
        register: this._registerMediaView,
      };

      this._registerFunctionsForAdIconView = {
        unregister: this._unregisterAdIconView,
        register: this._registerAdIconView,
      };

      this._clickableChildrenNodeHandles = new Map();

      this.state = {
        ad: null,
        // iOS requires a nonnull value
        mediaViewNodeHandle: -1,
        adIconViewNodeHandle: -1,
        clickableChildren: new Set(),
        canRequestAds: false,
      };
    }

    /**
     * On init, register for updates on `adsManager` to know when it becomes available
     */
    componentDidMount() {
      this._subscription = this.props.adsManager.onAdsLoaded(() =>
        this.setState({ canRequestAds: true })
      );
    }

    componentDidUpdate(prevProps: NativeAdWrapperProps, prevState: NativeAdWrapperState) {
      if (this.state.mediaViewNodeHandle !== -1) {
        const mediaViewNodeHandleChanged =
          this.state.mediaViewNodeHandle !== prevState.mediaViewNodeHandle;
        const adIconViewNodeHandleChanged =
          this.state.adIconViewNodeHandle !== prevState.adIconViewNodeHandle;
        const clickableChildrenDiff = [...prevState.clickableChildren].filter(
          child => !this.state.clickableChildren.has(child)
        );
        const clickableChildrenChanged =
          prevState.clickableChildren.size !== this.state.clickableChildren.size ||
          clickableChildrenDiff.length > 0;

        if (mediaViewNodeHandleChanged || adIconViewNodeHandleChanged || clickableChildrenChanged) {
          AdsManager.registerViewsForInteractionAsync(
            findNodeHandle(this._nativeAdViewRef),
            this.state.mediaViewNodeHandle,
            this.state.adIconViewNodeHandle,
            [...this.state.clickableChildren]
          );
        }
      }
    }

    /**
     * Clear subscription when component goes off screen
     */
    componentWillUnmount() {
      if (this._subscription) {
        this._subscription.remove();
      }
    }

    _registerMediaView = (mediaView: NativeMediaView) =>
      this.setState({ mediaViewNodeHandle: findNodeHandle(mediaView) });
    _unregisterMediaView = () => this.setState({ mediaViewNodeHandle: -1 });

    _registerAdIconView = (adIconView: NativeAdIconView) =>
      this.setState({ adIconViewNodeHandle: findNodeHandle(adIconView) });
    _unregisterAdIconView = () => this.setState({ adIconViewNodeHandle: -1 });

    _registerClickableChild = (child: React.Node) => {
      this._clickableChildrenNodeHandles.set(child, findNodeHandle(child));
      this.setState({ clickableChildren: this.state.clickableChildren.add(findNodeHandle(child)) });
    };

    _unregisterClickableChild = (child: React.Node) => {
      this.setState(({ clickableChildren }) => {
        const newClickableChildren: Set<number> = new Set(clickableChildren);
        const nodeHandle = this._clickableChildrenNodeHandles.get(child);

        if (nodeHandle) {
          newClickableChildren.delete(nodeHandle);
          this._clickableChildrenNodeHandles.delete(child);
          return { clickableChildren: newClickableChildren };
        }
      });
    };

    _onTriggerEvent = () => {
      if (this.state.mediaViewNodeHandle !== -1 && Platform.OS === 'android') {
        AdsManager.triggerEvent(findNodeHandle(this._nativeAdViewRef));
      }
    };

    _handleAdUpdated = () => this.props.onAdLoaded && this.props.onAdLoaded(this.state.ad);

    _handleAdLoaded = ({ nativeEvent }: { nativeEvent: NativeAd }) => {
      this.setState({ ad: nativeEvent }, this._handleAdUpdated);
    };

    _handleNativeAdViewMount = (ref: ?NativeAdView) => {
      this._nativeAdViewRef = ref;
    };

    renderAdComponent(componentProps: T) {
      if (this.state.ad) {
        return (
          <AdIconViewContext.Provider value={this._registerFunctionsForAdIconView}>
            <MediaViewContext.Provider value={this._registerFunctionsForMediaView}>
              <TriggerableContext.Provider value={this._registerFunctionsForTriggerables}>
                <Component {...componentProps} nativeAd={this.state.ad} />
              </TriggerableContext.Provider>
            </MediaViewContext.Provider>
          </AdIconViewContext.Provider>
        );
      }
      return null;
    }

    render() {
      const { adsManager, ...props } = this.props;
      delete props.onAdLoaded;

      if (!this.state.canRequestAds) {
        return null;
      }

      return (
        <NativeAdView
          ref={this._handleNativeAdViewMount}
          adsManager={adsManager.toJSON()}
          onAdLoaded={this._handleAdLoaded}>
          {this.renderAdComponent(props)}
        </NativeAdView>
      );
    }
  };
