import React from 'react';
import {
  Dimensions,
  EventSubscription,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { useSharedValue, interpolate } from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';

import DevMenuBottomSheetContext from './DevMenuBottomSheetContext';
import * as DevMenu from './DevMenuModule';

type Props = {
  uuid: string;
  children?: React.ReactNode;
};

class DevMenuBottomSheet extends React.PureComponent<Props, any> {
  // We need to track whether the bottom sheet is expanded to prevent
  // collapsing on some unnecessary `onCloseEnd` calls.
  hasExpandingFinished: boolean = false;

  ref = React.createRef<BottomSheet>();

  snapPoints = [0, Math.max(BottomSheet.renumber('50%'), 600), '90%'];

  callbackNode = useSharedValue(0);

  backgroundOpacity = interpolate(this.callbackNode.value, [0, 1], [0.5, 0]);

  closeSubscription: EventSubscription | null = null;

  componentDidMount() {
    this.expand();

    // Before the dev menu can be actually closed, we need to collapse its sheet view,
    // and this listens for close requests that come from native side to start collapsing the view.
    // The awaited return value of this listener is then send back as a response
    // so the native module knows when it can fully close dev menu (detach its root view).
    this.closeSubscription = DevMenu.listenForCloseRequests(() => {
      // `collapse` returns a promise, so this `return` is important to finish the close event once the view is fully collapsed.
      return this.collapse();
    });
  }

  componentDidUpdate(prevProps: Props) {
    // Make sure it gets expanded once we receive new identifier.
    if (prevProps.uuid !== this.props.uuid) {
      this.expand();
    }
  }

  componentWillUnmount() {
    this.unsubscribeCloseSubscription();
  }

  collapse = (): Promise<void> => {
    this.hasExpandingFinished = false;
    this.ref.current && this.ref.current.snapTo(0);

    // Use setTimeout until there is a better solution to execute something once the sheet is fully collapsed.
    return new Promise((resolve) => setTimeout(resolve, 300));
  };

  collapseAndClose = async () => {
    await this.collapse();
    await DevMenu.closeAsync();
  };

  expand = () => {
    this.ref.current && this.ref.current.snapTo(1);

    setTimeout(() => {
      this.hasExpandingFinished = true;
    }, 300);
  };

  unsubscribeCloseSubscription = () => {
    if (this.closeSubscription) {
      this.closeSubscription.remove();
      this.closeSubscription = null;
    }
  };

  onCloseEnd = () => {
    if (this.hasExpandingFinished) {
      this.collapseAndClose();
    }
  };

  providedContext = {
    expand: this.expand,
    collapse: this.collapse,
  };

  renderHeader = () => {
    return (
      <View style={styles.bottomSheetHeader}>
        <View style={styles.bottomSheetHeaderBar} />
      </View>
    );
  };

  renderContent = () => {
    return <View style={styles.bottomSheetContent}>{this.props.children}</View>;
  };

  render() {
    return (
      <DevMenuBottomSheetContext.Provider value={this.providedContext}>
        <View style={styles.bottomSheetContainer}>
          <TouchableWithoutFeedback onPress={this.collapseAndClose}>
            <Animated.View
              style={[styles.bottomSheetBackground, { opacity: this.backgroundOpacity }]}
            />
          </TouchableWithoutFeedback>
          <BottomSheet
            ref={this.ref}
            initialSnap={0}
            enabledInnerScrolling={false}
            overdragResistanceFactor={1.5}
            snapPoints={this.snapPoints}
            callbackNode={this.callbackNode}
            renderHeader={this.renderHeader}
            renderContent={this.renderContent}
            onCloseEnd={this.onCloseEnd}
          />
        </View>
      </DevMenuBottomSheetContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
  },
  bottomSheetBackground: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  bottomSheetHeaderBar: {
    flex: 1,
    width: 40,
    height: 5,
    backgroundColor: '#fff',
    borderRadius: 40,
    opacity: 0.8,
  },
  bottomSheetContent: {
    height: Dimensions.get('window').height,
  },
});

export default DevMenuBottomSheet;
