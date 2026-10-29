import { Link, usePathname, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/react-navigation';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const PRESENTATIONS = [
  'card',
  'modal',
  'transparentModal',
  'containedModal',
  'containedTransparentModal',
  'fullScreenModal',
  'formSheet',
  'pageSheet',
] as const;

// `default` opens the screen with no `presentation` option.
const LINKS = [...PRESENTATIONS, 'default'];

export function PresentationPanel({ title }: { title: string }) {
  const pathname = usePathname();
  const { key } = useRoute();
  const index = useNavigationState((state) => state.routes.findIndex((r) => r.key === key));

  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text>Stack index: {index}</Text>
        <Text>Path: {pathname}</Text>
      </View>
      {LINKS.map((presentation) => {
        const href = { pathname: '/modals/[presentation]', params: { presentation } } as const;
        return (
          <View key={presentation} style={styles.row}>
            <Text style={styles.label}>{presentation}</Text>
            <Link href={href} push asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Push</Text>
              </Pressable>
            </Link>
            <Link href={href} replace asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Replace</Text>
              </Pressable>
            </Link>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
  },
  button: {
    backgroundColor: 'rgb(11, 103, 175)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  },
});
