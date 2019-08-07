import nullthrows from 'nullthrows';
import React from 'react';
import { Platform, findNodeHandle } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';
import AdsManager from './NativeAdsManager';
let NativeAdLayout = Platform.OS === 'android' ? requireNativeViewManager('NativeAdLayout') : null;
/**
 * A higher-order function that wraps the given `Component` type and returns a new container
 * component type that passes in an extra `nativeAd` prop to the wrapped component.
 *
 * The container component renders null if the native ads manager is not yet ready to display ads or
 * if no ad could be loaded.
 */
export default function withNativeAd(Component) {
    return class NativeAdContainer extends React.Component {
        constructor(props) {
            super(props);
            this._subscription = null;
            this._nativeAdViewRef = React.createRef();
            this._adMediaViewNodeHandle = null;
            this._adIconViewNodeHandle = null;
            this._interactiveTriggerNodeHandles = new Map();
            this._handleAdLoaded = ({ nativeEvent: ad }) => {
                this.setState({ ad }, () => {
                    if (this.props.onAdLoaded) {
                        let ad = nullthrows(this.state.ad);
                        this.props.onAdLoaded(ad);
                    }
                });
            };
            this._adMediaViewContextValue = {
                nativeRef: (component) => {
                    if (component) {
                        this._setAdNodeHandles({ adMediaViewNodeHandle: nullthrows(findNodeHandle(component)) });
                    }
                    else {
                        this._setAdNodeHandles({ adMediaViewNodeHandle: null });
                    }
                },
            };
            this._adOptionsViewContextValue = {
                nativeAdViewRef: this._nativeAdViewRef
            };
            this._adIconViewContextValue = {
                nativeRef: (component) => {
                    if (component) {
                        this._setAdNodeHandles({ adIconViewNodeHandle: nullthrows(findNodeHandle(component)) });
                    }
                    else {
                        this._setAdNodeHandles({ adIconViewNodeHandle: null });
                    }
                },
            };
            this._adTriggerViewContextValue = {
                registerComponent: (component) => {
                    let nodeHandle = nullthrows(findNodeHandle(component));
                    let interactiveTriggerNodeHandles = new Map(this._interactiveTriggerNodeHandles);
                    interactiveTriggerNodeHandles.set(component, nodeHandle);
                    this._setAdNodeHandles({ interactiveTriggerNodeHandles });
                },
                unregisterComponent: (component) => {
                    let interactiveTriggerNodeHandles = new Map(this._interactiveTriggerNodeHandles);
                    interactiveTriggerNodeHandles.delete(component);
                    this._setAdNodeHandles({ interactiveTriggerNodeHandles });
                },
                onTriggerAd: () => {
                    if (this._adMediaViewNodeHandle !== null && Platform.OS === 'android') {
                        let nodeHandle = findNodeHandle(this._nativeAdViewRef.current);
                        AdsManager.triggerEvent(nodeHandle);
                    }
                },
            };
            this.state = {
                ad: null,
                canRequestAds: props.adsManager.isValid,
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
            let viewHierarchy = (<NativeAdView ref={this._nativeAdViewRef} adsManager={adsManager.placementId} onAdLoaded={this._handleAdLoaded}>
            <AdMediaViewContext.Provider value={this._adMediaViewContextValue}>
              <AdIconViewContext.Provider value={this._adIconViewContextValue}>
                <AdTriggerViewContext.Provider value={this._adTriggerViewContextValue}>
                  <AdOptionsViewContext.Provider value={this._adOptionsViewContextValue}>
                    {this.state.ad ? (<Component {...props} nativeAd={this.state.ad}/>) : null}
                  </AdOptionsViewContext.Provider>
                </AdTriggerViewContext.Provider>
              </AdIconViewContext.Provider>
            </AdMediaViewContext.Provider>
          </NativeAdView>);
            if (NativeAdLayout) {
                return (<NativeAdLayout>
            {viewHierarchy}
          </NativeAdLayout>);
            }
            return viewHierarchy;
        }
        _getForwardedProps() {
            let { adsManager, onAdLoaded, ...props } = this.props;
            return props;
        }
        /**
         * Updates the registered ad views given their node handles. The node handles are not stored in
         * this component's state nor does this method call "setState" to avoid unnecessarily
         * re-rendering.
         */
        _setAdNodeHandles({ adMediaViewNodeHandle = this._adMediaViewNodeHandle, adIconViewNodeHandle = this._adIconViewNodeHandle, interactiveTriggerNodeHandles = this._interactiveTriggerNodeHandles, }) {
            let adMediaViewChanged = adMediaViewNodeHandle !== this._adMediaViewNodeHandle;
            let adIconViewChanged = adIconViewNodeHandle !== this._adIconViewNodeHandle;
            let interactiveTriggersChanged = !_areEqualSets(new Set(interactiveTriggerNodeHandles.values()), new Set(this._interactiveTriggerNodeHandles.values()));
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
const NativeAdView = requireNativeViewManager('CTKNativeAd');
export const AdIconViewContext = React.createContext(null);
export const AdMediaViewContext = React.createContext(null);
export const AdTriggerViewContext = React.createContext(null);
export const AdOptionsViewContext = React.createContext(null);
function _areEqualSets(set1, set2) {
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
//# sourceMappingURL=withNativeAd.js.map