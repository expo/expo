import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import * as DevMenu from './DevMenuModule';

type Props = {
  uuid: string;
  children?: React.ReactNode;
};

function DevMenuBottomSheet({ children, uuid }: Props) {
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const onClose = async () => {
    await DevMenu.closeAsync();
  };
  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);

  useEffect(() => {
    bottomSheetRef.current?.expand();
  }, [uuid]);

  useEffect(() => {
    const closeSubscription = DevMenu.listenForCloseRequests(() => {
      bottomSheetRef.current?.collapse();
      return new Promise((resolve) => {
        resolve(true);
      });
    });
    return () => {
      closeSubscription.remove();
    };
  }, []);

  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialSnapPoints);

  return (
    <BottomSheet
      key={uuid}
      ref={bottomSheetRef}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      handleComponent={null}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      backgroundStyle={styles.bottomSheetBackground}
      enablePanDownToClose
      onClose={onClose}>
      <BottomSheetView style={styles.contentContainerStyle} onLayout={handleContentLayout}>
        {children}
      </BottomSheetView>
      {/* Adds bottom offset so that no empty space is shown on overdrag */}
      <View style={{ height: 100 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
  },
  contentContainerStyle: {},
  bottomSheetBackground: {
    backgroundColor: '#f8f8fa',
  },
});

export default DevMenuBottomSheet;
