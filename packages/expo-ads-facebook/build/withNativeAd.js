import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { Platform, findNodeHandle } from 'react-native';
import AdsManager from './NativeAdsManager';
const NativeAdLayout = Platform.OS === 'android' ? requireNativeViewManager('NativeAdLayout') : null;
/**
 * A higher-order function that wraps the given `Component` type and returns a new container
 * component type that passes in an extra `nativeAd` prop to the wrapped component.
 *
 * The container component renders null if the native ads manager is not yet ready to display ads or
 * if no ad could be loaded.
 */
export default function withNativeAd(Component) {
    return class NativeAdContainer extends React.Component {
        _readySubscription = null;
        _errorSubscription = null;
        _nativeAdViewRef = React.createRef();
        _adMediaViewNodeHandle = null;
        _adIconViewNodeHandle = null;
        _interactiveTriggerNodeHandles = new Map();
        state;
        constructor(props) {
            super(props);
            this.state = {
                ad: null,
                canRequestAds: props.adsManager.isValid,
            };
        }
        componentDidMount() {
            if (!this.state.canRequestAds) {
                // On mounting, listen to the ads manager to learn when it is ready to display ads
                this._readySubscription = this.props.adsManager.onAdsLoaded(() => {
                    this.setState({ canRequestAds: true });
                });
            }
            this._errorSubscription = this.props.adsManager.onAdsErrored((error) => {
                // From what I, @sjchmiela, understand, an error may be encountered multiple times
                // and it does *not* mean that the manager is not able to request ads at all -
                // - this may have been an intermittent error -- that's why we don't set canRequestAds to false
                // here.
                // If the configuration is invalid from the start, the manager will never emit
                // the onAdsLoaded event and the component would never think it could request ads.
                if (this.props.onError) {
                    this.props.onError(error);
                }
            });
        }
        componentWillUnmount() {
            if (this._readySubscription) {
                this._readySubscription.remove();
                this._readySubscription = null;
            }
            if (this._errorSubscription) {
                this._errorSubscription.remove();
                this._errorSubscription = null;
            }
        }
        render() {
            if (!this.state.canRequestAds) {
                return null;
            }
            const { adsManager } = this.props;
            const props = this._getForwardedProps();
            const viewHierarchy = (React.createElement(NativeAdView, { ref: this._nativeAdViewRef, adsManager: adsManager.placementId, onAdLoaded: this._handleAdLoaded },
                React.createElement(AdMediaViewContext.Provider, { value: this._adMediaViewContextValue },
                    React.createElement(AdIconViewContext.Provider, { value: this._adIconViewContextValue },
                        React.createElement(AdTriggerViewContext.Provider, { value: this._adTriggerViewContextValue },
                            React.createElement(AdOptionsViewContext.Provider, { value: this._adOptionsViewContextValue }, this.state.ad ? React.createElement(Component, { ...props, nativeAd: this.state.ad }) : null))))));
            if (NativeAdLayout) {
                return React.createElement(NativeAdLayout, null, viewHierarchy);
            }
            return viewHierarchy;
        }
        _getForwardedProps() {
            const { adsManager, onAdLoaded, ...props } = this.props;
            return props;
        }
        _handleAdLoaded = ({ nativeEvent: ad }) => {
            this.setState({ ad }, () => {
                if (this.props.onAdLoaded) {
                    const ad = nullthrows(this.state.ad);
                    this.props.onAdLoaded(ad);
                }
            });
        };
        _adMediaViewContextValue = {
            nativeRef: (component) => {
                if (component) {
                    this._setAdNodeHandles({ adMediaViewNodeHandle: nullthrows(findNodeHandle(component)) });
                }
                else {
                    this._setAdNodeHandles({ adMediaViewNodeHandle: null });
                }
            },
        };
        _adOptionsViewContextValue = {
            nativeAdViewRef: this._nativeAdViewRef,
        };
        _adIconViewContextValue = {
            nativeRef: (component) => {
                if (component) {
                    this._setAdNodeHandles({ adIconViewNodeHandle: nullthrows(findNodeHandle(component)) });
                }
                else {
                    this._setAdNodeHandles({ adIconViewNodeHandle: null });
                }
            },
        };
        _adTriggerViewContextValue = {
            registerComponent: (component) => {
                const nodeHandle = nullthrows(findNodeHandle(component));
                const interactiveTriggerNodeHandles = new Map(this._interactiveTriggerNodeHandles);
                interactiveTriggerNodeHandles.set(component, nodeHandle);
                this._setAdNodeHandles({ interactiveTriggerNodeHandles });
            },
            unregisterComponent: (component) => {
                const interactiveTriggerNodeHandles = new Map(this._interactiveTriggerNodeHandles);
                interactiveTriggerNodeHandles.delete(component);
                this._setAdNodeHandles({ interactiveTriggerNodeHandles });
            },
            onTriggerAd: () => {
                if (this._adMediaViewNodeHandle !== null && Platform.OS === 'android') {
                    const nodeHandle = findNodeHandle(this._nativeAdViewRef.current);
                    AdsManager.triggerEvent(nodeHandle);
                }
            },
        };
        /**
         * Updates the registered ad views given their node handles. The node handles are not stored in
         * this component's state nor does this method call "setState" to avoid unnecessarily
         * re-rendering.
         */
        _setAdNodeHandles({ adMediaViewNodeHandle = this._adMediaViewNodeHandle, adIconViewNodeHandle = this._adIconViewNodeHandle, interactiveTriggerNodeHandles = this._interactiveTriggerNodeHandles, }) {
            const adMediaViewChanged = adMediaViewNodeHandle !== this._adMediaViewNodeHandle;
            const adIconViewChanged = adIconViewNodeHandle !== this._adIconViewNodeHandle;
            const interactiveTriggersChanged = !_areEqualSets(new Set(interactiveTriggerNodeHandles.values()), new Set(this._interactiveTriggerNodeHandles.values()));
            if (adMediaViewChanged || adIconViewChanged || interactiveTriggersChanged) {
                this._adMediaViewNodeHandle = adMediaViewNodeHandle;
                this._adIconViewNodeHandle = adIconViewNodeHandle;
                this._interactiveTriggerNodeHandles = interactiveTriggerNodeHandles;
                // TODO: handle unregistering views when components are unmounted
                if (this._adMediaViewNodeHandle !== null && this._adIconViewNodeHandle !== null) {
                    AdsManager.registerViewsForInteractionAsync(nullthrows(findNodeHandle(this._nativeAdViewRef.current)), this._adMediaViewNodeHandle, this._adIconViewNodeHandle, [...this._interactiveTriggerNodeHandles.values()]);
                }
            }
        }
    };
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
const NativeAdView = requireNativeViewManager('CTKNativeAd');
export const AdIconViewContext = React.createContext(null);
export const AdMediaViewContext = React.createContext(null);
export const AdTriggerViewContext = React.createContext(null);
export const AdOptionsViewContext = React.createContext(null);
function _areEqualSets(set1, set2) {
    if (set1.size !== set2.size) {
        return false;
    }
    for (const item of set1.values()) {
        if (!set2.has(item)) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=withNativeAd.js.map