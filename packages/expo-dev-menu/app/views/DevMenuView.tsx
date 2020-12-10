import React from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import DevMenuContext, { Context } from '../DevMenuContext';
import { StyledText } from '../components/Text';
import Colors from '../constants/Colors';
import DevMenuItemsList from './DevMenuItemsList';
import DevMenuAppInfo from './DevMenuAppInfo';
import { DevMenuAppInfoType, DevMenuItemAnyType } from '../DevMenuInternal';

type Props = {
  appInfo: DevMenuAppInfoType;
  uuid: string;
  devMenuItems: DevMenuItemAnyType[];
  enableDevelopmentTools: boolean;
  showOnboardingView: boolean;
};

class DevMenuView extends React.PureComponent<Props, undefined> {
  static contextType = DevMenuContext;

  context!: Context;

  collapse = () => {
    this.context?.collapse?.();
  };

  renderItems() {
    return <DevMenuItemsList items={this.context.devMenuItems} />;
  }

  renderContent() {
    const { appInfo } = this.props;

    return (
      <>
        <DevMenuAppInfo appInfo={appInfo} />
        <View style={styles.itemsContainer}>{this.renderItems()}</View>
      </>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderContent()}
        {/* Enable this to test scrolling
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()}
        {this.renderContent()} */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appInfo: {
    borderBottomWidth: 2 / PixelRatio.get(),
  },
  itemsContainer: {
    marginTop: 7,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 3, // should be higher than zIndex of onboarding container
  },
});

export default DevMenuView;
