import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 60, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Transparent Modal</Text>
      <Text>
        This is a transparent modal to demonstrate default behaviour. You need to navigate or use
        the back button to dismiss it. You can't dismiss it by tapping outside the modal.
      </Text>
      <Text>
        The modal is transparent, so you can see the background behind it. The background color is
        not part of the modal, it's the background of the page.
      </Text>
    </View>
  );
}
