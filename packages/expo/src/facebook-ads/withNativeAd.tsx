import { EventSubscription } from 'fbemitter';
import nullthrows from 'nullthrows';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Platform,
  View,
  ViewPropTypes,
  findNodeHandle,
  requireNativeComponent,
} from 'react-native';

import { NativeAdIconView } from './AdIconView';
import { NativeAdMediaView } from './AdMediaView';
import AdsManager from './NativeAdsManager';

type AdContainerProps<P> = {
  adsManager: AdsManager;
  // TODO: rename this to onAdLoad
  onAdLoaded?: ((ad: NativeAd) => void) | null;
} & P;

type AdContainerState = {
  ad: NativeAd | null;
  canRequestAds: boolean;
  adMediaViewNodeHandle: number | null;
  adIconViewNodeHandle: number | null;
  interactiveTriggerNodeHandles: Map<React.Component, number>;
};

type AdProps = { nativeAd: NativeAd };

/**
 * A higher-order function that wraps the given `Component` type and returns a new container
 * component type that passes in an extra `nativeAd` prop to the wrapped component.
 *
 * The container component renders null if the native ads manager is not yet ready to display ads or
 * if no ad could be loaded.
 */
export default function withNativeAd<P>(
  Component: React.ComponentType<P & AdProps>
): React.ComponentType<AdContainerProps<P>> {
  return class NativeAdContainer extends React.Component<AdContainerProps<P>, AdContainerState> {
    _subscription: EventSubscription | null = null;
    _nativeAdViewRef = React.createRef<NativeAdView>();

    state: AdContainerState;

    constructor(props: AdContainerProps<P>) {
      super(props);
      this.state = {
        ad: null,
        canRequestAds: props.adsManager.isValid,
        adMediaViewNodeHandle: null,
        adIconViewNodeHandle: null,
        interactiveTriggerNodeHandles: new Map<React.Component, number>(),
      };
    }

    componentDidMount() {
      if (!this.state.canRequestAds) {
        // On mounting, listen to the ads manager to learn when it is ready to display ads
        this._subscription = this.props.adsManager.onAdsLoaded(() => {
          this.setState({ canRequestAds: true });
        });
      }
    }

    componentDidUpdate(prevProps: AdContainerProps<P>, prevState: AdContainerState) {
      let adMediaViewChanged = this.state.adMediaViewNodeHandle !== prevState.adMediaViewNodeHandle;
      let adIconViewChanged = this.state.adIconViewNodeHandle !== prevState.adIconViewNodeHandle;
      let interactiveTriggersChanged = _areEqualSets(
        new Set(this.state.interactiveTriggerNodeHandles.values()),
        new Set(prevState.interactiveTriggerNodeHandles.values())
      );

      if (adMediaViewChanged || adIconViewChanged || interactiveTriggersChanged) {
        // TODO: handle unregistering views when components are unmounted
        AdsManager.registerViewsForInteractionAsync(
          nullthrows(findNodeHandle(this._nativeAdViewRef.current)),
          this.state.adMediaViewNodeHandle !== null ? this.state.adMediaViewNodeHandle : -1,
          this.state.adIconViewNodeHandle !== null ? this.state.adIconViewNodeHandle : -1,
          [...this.state.interactiveTriggerNodeHandles.values()]
        );
      }
    }

    componentWillUnmount() {
      if (this._subscription) {
        this._subscription.remove();
        this._subscription = null;
      }
    }

    render() {
      if (!this.state.canRequestAds) {
        return null;
      }

      let { adsManager } = this.props;
      let props = this._getForwardedProps();
      return (
        <NativeAdView
          ref={this._nativeAdViewRef}
          adsManager={adsManager.placementId}
          onAdLoaded={this._handleAdLoaded}>
          <AdMediaViewContext.Provider value={this._adMediaViewContextValue}>
            <AdIconViewContext.Provider value={this._adIconViewContextValue}>
              <AdTriggerViewContext.Provider value={this._adTriggerViewContextValue}>
                {this.state.ad ? <Component {...props} nativeAd={this.state.ad} /> : null}
              </AdTriggerViewContext.Provider>
            </AdIconViewContext.Provider>
          </AdMediaViewContext.Provider>
        </NativeAdView>
      );
    }

    _getForwardedProps(): P {
      let { adsManager, onAdLoaded, ...props } = this.props as any;
      return props as P;
    }

    _handleAdLoaded = ({ nativeEvent: ad }: { nativeEvent: NativeAd }) => {
      this.setState({ ad }, () => {
        if (this.props.onAdLoaded) {
          let ad = nullthrows(this.state.ad);
          this.props.onAdLoaded(ad);
        }
      });
    };

    _adMediaViewContextValue = {
      nativeRef: (component: NativeAdMediaView | null) => {
        if (component) {
          this.setState({ adMediaViewNodeHandle: nullthrows(findNodeHandle(component)) });
        } else {
          this.setState({ adMediaViewNodeHandle: null });
        }
      },
    };

    _adIconViewContextValue = {
      nativeRef: (component: NativeAdIconView | null) => {
        if (component) {
          this.setState({ adIconViewNodeHandle: nullthrows(findNodeHandle(component)) });
        } else {
          this.setState({ adIconViewNodeHandle: null });
        }
      },
    };

    _adTriggerViewContextValue = {
      registerComponent: (component: React.Component) => {
        let nodeHandle = nullthrows(findNodeHandle(component));
        this.setState(state => {
          let interactiveTriggerNodeHandles = new Map(state.interactiveTriggerNodeHandles);
          interactiveTriggerNodeHandles.set(component, nodeHandle);
          return { interactiveTriggerNodeHandles };
        });
      },
      unregisterComponent: (component: React.Component) => {
        this.setState(state => {
          let interactiveTriggerNodeHandles = new Map(state.interactiveTriggerNodeHandles);
          interactiveTriggerNodeHandles.delete(component);
          return { interactiveTriggerNodeHandles };
        });
      },
      onTriggerAd: () => {
        if (this.state.adMediaViewNodeHandle !== null && Platform.OS === 'android') {
          let nodeHandle = findNodeHandle(this._nativeAdViewRef.current)!;
          AdsManager.triggerEvent(nodeHandle);
        }
      },
    };
  };
}

type NativeAdViewProps = {
  adsManager: string;
  onAdLoaded?: ({ nativeEvent: NativeAd }) => void;
} & React.ElementProps<View>;

type NativeAdView = React.Component<NativeAdViewProps>;

const NativeAdView = requireNativeComponent('CTKNativeAd', {
  propTypes: {
    ...ViewPropTypes,
    adsManager: PropTypes.string.isRequired,
    onAdLoaded: PropTypes.func,
  },
});

// React contexts for ad views that need to register with the ad container
export type AdIconViewContextValue = {
  nativeRef: (component: NativeAdMediaView | null) => void;
};

export type AdMediaViewContextValue = {
  nativeRef: (component: NativeAdIconView | null) => void;
};

export type AdTriggerViewContextValue = {
  registerComponent: (component: React.Component) => void;
  unregisterComponent: (component: React.Component) => void;
  onTriggerAd: () => void;
};

export const AdIconViewContext = React.createContext<AdIconViewContextValue | null>(null);
export const AdMediaViewContext = React.createContext<AdMediaViewContextValue | null>(null);
export const AdTriggerViewContext = React.createContext<AdTriggerViewContextValue | null>(null);

export type NativeAd = {
  /**
   * The headline the advertiser entered when they created their ad. This is usually the ad's main
   * title.
   */
  headline?: string;

  /**
   * The link description which is additional information that the advertiser may have entered
   */
  linkDescription?: string;

  /**
   * The name of the Facebook Page or mobile app that represents the business running the ad
   */
  advertiserName?: string;

  /**
   * The ad's social context, such as, "Over half a million users"
   */
  socialContext?: string;

  /**
   * The call-to-action phrase of the ad, such as, "Install Now"
   */
  callToActionText?: string;

  /**
   * The body text, truncated to 90 characters, that contains the text the advertiser entered when
   * they created their ad to tell people what the ad promotes
   */
  bodyText?: string;

  /**
   * The word "ad", translated into the viewer's language
   *
   * TODO: Rename this field to `adTranslation` to be consistent with the other translation fields
   */
  translation?: string;

  /**
   * The word "promoted", translated into the viewer's language
   */
  promotedTranslation?: string;

  /**
   * The word "sponsored", translated into the viewer's language
   */
  sponsoredTranslation?: string;
};

function _areEqualSets<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) {
    return false;
  }

  for (let item of set1.values()) {
    if (!set2.has(item)) {
      return false;
    }
  }
  return true;
}
