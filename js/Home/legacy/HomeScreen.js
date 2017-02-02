/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule HomeScreen
 */
'use strict';

import Exponent from 'exponent';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ListView,
  NativeModules,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ResponsiveImage from '@exponent/react-native-responsive-image';

import autobind from 'autobind-decorator';
import Browser from 'Browser';
import BrowserActions from 'BrowserActions';
import ExColors from 'ExColors';
import ExUrls from 'ExUrls';
import FeaturedExperiences from 'FeaturedExperiences';
import FriendlyUrls from 'FriendlyUrls';
import HomeUrlBar from 'HomeUrlBar';
import Button from 'react-native-button';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ExponentKernel from 'ExponentKernel';

let {
  Asset,
  Components,
  Constants,
  Permissions,
} = Exponent;

function cacheImages(imageModules) {
  return imageModules.map(imageModule => {
    return Asset.fromModule(imageModule).downloadAsync();
  });
}

class HomeScreen extends React.Component {
  static getDataProps(data) {
    return {
      currentUrl: data.browser.foregroundTaskUrl,
      history: data.browser.history,
      isLoading: data.browser.isKernelLoading,
    };
  }

  static getDispatchActions(dispatch) {
    return {
      browserActions: bindActionCreators(BrowserActions, dispatch),
    };
  }

  constructor(props, context) {
    super(props, context);
    let dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });
    this.state = {
      dataSource: this._cloneDataSourceWithProps(dataSource, props),
      viewFinderActive: false,
      hasCameraPermission: false,
      assetsAreLoaded: false,
    };
  }

  componentWillMount() {
    this._loadAssetsAsync();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(state => ({
      dataSource: this._cloneDataSourceWithProps(state.dataSource, nextProps),
    }));
  }

  async _loadAssetsAsync() {
    const imageAssets = cacheImages([ require('../../Assets/ios-home-header-wordmark.png') ]);
    await Promise.all(imageAssets);
    this.setState({ assetsAreLoaded: true });
  }

  _cloneDataSourceWithProps(dataSource, props) {
    let { history } = props;
    return dataSource.cloneWithRowsAndSections({
      recent: history.toArray(),
      featured: FeaturedExperiences.getFeatured(),
    });
  }

  render() {
    let hasRecentLinks = this.props.history.size > 0;
    let activityIndicator = (
      <ActivityIndicator
        hidesWhenStopped
        animating={this.props.isLoading}
        style={styles.activityIndicator}
      />
    );

    let camera;
    if (this.state.viewFinderActive) {
      camera = (
        <View style={StyleSheet.absoluteFill}>
          <Components.BarCodeScanner
            style={StyleSheet.absoluteFill}
            onBarCodeRead={this._handleBarCodeRead}
          />
          <TouchableOpacity
            onPress={this._closeCamera}
            style={{position: 'absolute', top: 15, left: 15}}>
            <Text style={{fontSize: 20, color: '#fff'}}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // TODO: this is mostly just an asset test until @brent replaces HomeScreen
    let wordmark;
    if (this.state.assetsAreLoaded) {
      wordmark = (
        <Image
          source={require('../../Assets/ios-home-header-wordmark.png')}
          style={styles.exponent}
          />
      );
    }

    return (
      <View {...this.props} style={[styles.container, this.props.style]}>
        <StatusBar
          barStyle="light-content"
          hidden={this.state.viewFinderActive ? true : false}
          animated
          showHideTransition="slide"
        />
        <View style={styles.header}>
          <ResponsiveImage
            sources={{
              2: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-logo@2x.png' },
              3: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-logo@3x.png' },
            }}
            style={styles.logo}
          />
          <View>
            {wordmark}
          </View>
          {activityIndicator}

          {this._renderQRButton()}
        </View>
        <HomeUrlBar
          url={FriendlyUrls.toFriendlyString(this.props.currentUrl, false)}
          onSubmit={this._handleUrlSubmit}
          onRefresh={this._refresh}
          onQrPress={this._onQrPress}
          style={styles.urlBar}
        />

        <ListView
          enableEmptySections
          dataSource={this.state.dataSource}
          renderSectionHeader={this._renderSectionHeader}
          renderRow={this._renderHistoryItem}
          renderSeparator={this._renderHistoryItemSeparator}
          alwaysBounceVertical={hasRecentLinks}
          removeClippedSubviews={false}
          style={styles.historyList}
        />

        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarText}>v{Constants.exponentVersion} {ExponentKernel.__isFake && '(fake)'}</Text>
        </View>
        {camera}
      </View>
    );
  }

  _renderQRButton() {
    return (
      <View style={{position: 'absolute', right: 5, top: -4, bottom: 0, alignItems: 'center'}}>
        <TouchableOpacity
          style={{backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, height: 33, width: 33, alignItems: 'center', justifyContent: 'center'}}
          onPress={this._onQrPress}>
          <Image
            style={{width: 22, height: 22}}
            source={{uri: 'https://static.exponentjs.com/qr-code.png'}}
          />
        </TouchableOpacity>
      </View>
    );
  }

  _renderSectionHeader = (sectionData, sectionId) => {
    switch (sectionId) {
    case 'featured':
      return (
        <View style={styles.historyHeader}>
          <Text style={styles.historyHeaderText}>Featured</Text>
        </View>
      );
    case 'recent':
      if (this.props.history.size > 0) {
        return (
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.historyHeaderText}>Recent</Text>
              <Button
                onPress={() => this.props.browserActions.clearHistoryAsync()}
                style={styles.historyClearButton}>
                Clear
              </Button>
            </View>
            <View style={styles.historyHeaderBorder} />
          </View>
        );
      } else {
        return null;
      }
    }
  };

  _renderHistoryItem = (item, sectionId, rowId, highlightRow) => {
    let key = `${item.url}-${item.time}`;
    return (
      <HomeListItem
        key={key}
        activeOpacity={1}
        delayPressIn={50}
        onPressIn={() => {
          highlightRow(sectionId, rowId);
        }}
        onPressOut={() => {
          highlightRow(null);
        }}
        onPress={() => {
          this._loadUrlAsync(item.url).done();
        }}
        highlightedStyle={styles.highlightedHistoryItem}
        style={styles.historyItem}>
        <View>
          {item.manifest &&
            <Text style={styles.historyName}>
              {item.manifest.name}
            </Text>
          }
          <Text style={styles.url}>
            {FriendlyUrls.toFriendlyString(item.url)}
          </Text>
        </View>
      </HomeListItem>
    );
  };

  _renderHistoryItemSeparator = (sectionId, rowId, adjacentRowHighlighted) => {
    let highlightedStyle = adjacentRowHighlighted ? { marginLeft: 0 } : null;
    return (
      <View
        key={`sep-${sectionId}-${rowId}`}
        style={[styles.historyItemSeparator, highlightedStyle]}
      />
    );
  };

  @autobind
  _openCamera() {
    this.setState({viewFinderActive: true});
  }

  @autobind
  _closeCamera() {
    this.setState({viewFinderActive: false});
  }

  _onQrPress = () => {
    if (!this.state.hasCameraPermission) {
      Permissions.askAsync(Permissions.CAMERA).then(({ status }) =>
        this.setState({hasCameraPermission: status === 'granted'}), (state) => {
          if (state.hasCameraPermission) {
            this._openCamera();
          }
        });
    } else {
      this._openCamera();
    }
  }

  @autobind
  _handleBarCodeRead({ data: url }) {
    this.setState({viewFinderActive: false}, () => {
      url = ExUrls.normalizeUrl(url);
      if (url) {
        this._loadUrlAsync(url, true).done();
      }
    });
  }

  _handleUrlSubmit = (event) => {
    let url = event.nativeEvent.text.trim();
    if (url.toLowerCase() === 'dev menu' || url.toLowerCase() === 'dm') {
      ExponentKernel.addDevMenu();
    } else {
      url = ExUrls.normalizeUrl(url);
      if (url) {
        this._loadUrlAsync(url, true).done();
      }
    }
  };

  async _loadUrlAsync(url, isFromUrlBar = false) {
    if (isFromUrlBar) {
      // since the user typed this into the exponent url bar, don't validate that we can open it,
      // just try to open it.
      ExponentKernel.openURL(url);
    } else {
      let canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        Linking.openURL(url);
      }
    }
  }

  _refresh() {
    Browser.refresh();
  }
}

export default connect(
  data => HomeScreen.getDataProps(data),
  dispatch => HomeScreen.getDispatchActions(dispatch),
)(HomeScreen);

class HomeListItem extends React.Component {
  state = {
    isHighlighted: false,
  };

  render() {
    let {
      style,
      highlightedStyle,
      ...props,
    } = this.props;
    return (
      <TouchableOpacity
        {...props}
        onPressIn={this._handlePressIn}
        onPressOut={this._handlePressOut}
        style={[style, this.state.isHighlighted && highlightedStyle]}
      />
    );
  }

  _handlePressIn = (event) => {
    this.setState({ isHighlighted: true });
    if (this.props.onPressIn) {
      this.props.onPressIn(event);
    }
  };

  _handlePressOut = (event) => {
    this.setState({ isHighlighted: false });
    if (this.props.onPressOut) {
      this.props.onPressOut(event);
    }
  };
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 12,
    flexDirection: 'row',
  },
  logo: {
    width: 19.5,
    height: 17,
    marginTop: 4,
    marginRight: 12,
  },
  exponent: {
    width: 92,
    height: 20,
    marginTop: 4,
  },
  activityIndicator: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginLeft: 12,
  },
  urlBar: {
    marginTop: 4,
    marginBottom: 3,
  },
  backButton: {
    color: '#fff',
  },
  historyClearButton: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '200',
    marginRight: 6,
    marginTop: 2,
  },
  historyList: {
    flex: 1,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  historyHeader: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  historyHeaderText: {
    color: '#595c68',
    fontSize: 18,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  highlightedHistoryItem: {
    backgroundColor: ExColors.selectedRow,
  },
  url: {
    color: '#9ca0a6',
    fontSize: 12,
    marginTop: 1,
    marginBottom: 4,
  },
  historyName: {
    color: '#595c68',
    fontSize: 16,
    marginBottom: 1,
    marginTop: 4,
  },
  historyItemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  emptyHistoryText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginTop: 12,
  },
  bottomBar: {
    height: 24,
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    alignItems: 'flex-start',
  },
  bottomBarText: {
    color: '#8da5ba',
    fontSize: 10,
  },
});
