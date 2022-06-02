import React from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import DevMenuContext, { Context } from '../DevMenuContext';
import { DevMenuAppInfoType, DevMenuItemAnyType } from '../DevMenuInternal';
import ListFooter from '../components/ListFooter';
import MainOptions from '../components/MainOptions';
import DevMenuGroup from '../components/items/DevMenuGroup';
import DevMenuAppInfo from './DevMenuAppInfo';
import { StyledView } from '../components/Views';
import { StyledText } from '../components/Text';
import Colors from '../constants/Colors';

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
    return (
      <View testID="DevMenuMainScreen">
        <DevMenuGroup items={this.context.devMenuItems} />
        {this.props.enableDevelopmentTools &&
          this.props.devMenuItems.length > 0 &&
          global['HermesInternal'] && (
            <View>
              <StyledView
                style={styles.warningContainer}
                lightBackgroundColor={Colors.light.warningBackground}
                lightBorderColor={Colors.light.warningBorders}
                darkBackgroundColor={Colors.dark.warningBackground}
                darkBorderColor={Colors.dark.warningBorders}>
                <StyledText
                  style={styles.warning}
                  lightColor={Colors.light.warningColor}
                  darkColor={Colors.dark.warningColor}>
                  Debugging not working? Try manually reloading first
                </StyledText>
              </StyledView>
            </View>
          )}
        <MainOptions />
        <ListFooter label="This development menu will not be present in any release builds of this project." />
      </View>
    );
  }

  renderContent() {
    const { appInfo } = this.props;

    return (
      <>
        <DevMenuAppInfo appInfo={appInfo} />
        {this.renderItems()}
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

const pixel = 2 / PixelRatio.get();
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appInfo: {
    borderBottomWidth: 2 / PixelRatio.get(),
  },
  warningContainer: {
    marginHorizontal: -pixel,
    padding: 10,
    borderWidth: 1,
  },
  warning: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DevMenuView;
