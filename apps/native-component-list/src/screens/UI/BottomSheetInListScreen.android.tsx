import { BottomSheet, Text as UIText } from '@expo/ui';
import { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const ITEMS = Array.from({ length: 30 }, (_, index) => index);

// A sheet per row, with the first row at the list's top edge and no horizontal inset.
// FlatList clips offscreen children on Android, so the sheets must not depend on their row's view.
function CommunityRow({ index }: { index: number }) {
  const ref = useRef<BottomSheetModal>(null);
  return (
    <>
      <Pressable style={styles.row} onPress={() => ref.current?.present()}>
        <Text>{`Community ${index}`}</Text>
      </Pressable>
      <BottomSheetModal ref={ref} snapPoints={['50%', '85%']} enablePanDownToClose>
        <View style={styles.sheet}>
          <Text>{`Community sheet ${index}`}</Text>
        </View>
      </BottomSheetModal>
    </>
  );
}

function UniversalRow({ index }: { index: number }) {
  const [isPresented, setIsPresented] = useState(false);
  return (
    <>
      <Pressable style={styles.row} onPress={() => setIsPresented(true)}>
        <Text>{`Universal ${index}`}</Text>
      </Pressable>
      <BottomSheet isPresented={isPresented} onDismiss={() => setIsPresented(false)}>
        <UIText>{`Universal sheet ${index}`}</UIText>
      </BottomSheet>
    </>
  );
}

export default function BottomSheetInListScreen() {
  return (
    <FlatList
      data={ITEMS}
      contentContainerStyle={styles.list}
      keyExtractor={(index) => String(index)}
      renderItem={({ item }) =>
        item % 2 === 0 ? <CommunityRow index={item} /> : <UniversalRow index={item} />
      }
    />
  );
}

BottomSheetInListScreen.navigationOptions = {
  title: 'BottomSheet in a list',
};

const styles = StyleSheet.create({
  list: { rowGap: 12, paddingBottom: 32 },
  row: { padding: 20, borderRadius: 12, backgroundColor: '#fff' },
  sheet: { padding: 24 },
});
