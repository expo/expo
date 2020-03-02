import React from 'react';
import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
import {
  Dimensions,
  EventSubscription,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as DevMenu from './DevMenuModule';
import DevMenuBottomSheetContext from './DevMenuBottomSheetContext';

type Props = {
  uuid: string;
};

class DevMenuBottomSheet extends React.PureComponent<Props, any> {
  ref = React.createRef<BottomSheet>();

  snapPoints = [0, Math.max(BottomSheet.renumber('50%'), 600), '90%'];

  callbackNode = new Animated.Value(0);

  backgroundOpacity = this.callbackNode.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  closeStarted = false;

  closeSubscription: EventSubscription | null = null;

  componentDidMount() {
    this.expand();

    // Before the dev menu can be actually closed, we need to collapse its sheet view,
    // and this listens for close requests that come from native side to start collapsing the view.
    // The awaited return value of this listener is then send back as a response
    // so the native module knows when it can fully close dev menu (detach its root view).
    this.closeSubscription = DevMenu.listenForCloseRequests(() => {
      // Unsubscribe immediately so we don't accidentally collapse twice.
      // Also componentWillUnmount is not called (why?) when the app is hot reloading this component,
      // despite the componentDidMount is later called after first render.
      this.unsubscribeCloseSubscription();

      // `collapse` returns a promise, so this `return` is important to finish the close event once the view is fully collapsed.
      return this.collapse();
    });
  }

  componentDidUpdate(prevProps) {
    // Make sure it gets expanded once we receive new identifier.
    if (prevProps.uuid !== this.props.uuid) {
      this.closeStarted = false;
      this.expand();
    }
  }

  componentWillUnmount() {
    this.unsubscribeCloseSubscription();
  }

  collapse = (): Promise<void> => {
    // @tsapeta: There is a bug in react-native-reanimated@1.7.0 that can be workarounded by calling `snapTo` twice.
    this.ref.current && this.ref.current.snapTo(0);
    this.ref.current && this.ref.current.snapTo(0);

    // Use setTimeout until there is a better solution to execute something once the sheet is fully collapsed.
    return new Promise(resolve => setTimeout(resolve, 300));
  };

  collapseAndClose = async () => {
    await this.collapse();
    await DevMenu.closeAsync();
  };

  expand = () => {
    // @tsapeta: There is a bug in react-native-reanimated@1.7.0 that can be workarounded by calling `snapTo` twice.
    this.ref.current && this.ref.current.snapTo(1);
    this.ref.current && this.ref.current.snapTo(1);
  };

  unsubscribeCloseSubscription = () => {
    if (this.closeSubscription) {
      this.closeSubscription.remove();
      this.closeSubscription = null;
    }
  };

  onCloseStart = () => {
    this.closeStarted = true;
  };

  onCloseEnd = () => {
    if (this.closeStarted) {
      this.closeStarted = false;
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
            onCloseStart={this.onCloseStart}
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 30,
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
