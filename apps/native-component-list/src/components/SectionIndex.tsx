import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../constants/Colors';
import HeadingText from './HeadingText';

type Section = { title: string; y: number };

type SectionIndexContextValue = {
  sections: Section[];
  register: (title: string, y: number) => void;
  unregister: (title: string) => void;
  scrollToSection: (title: string) => void;
};

const SectionIndexContext = createContext<SectionIndexContextValue | null>(null);

export function SectionIndexScrollView(props: PropsWithChildren<ScrollViewProps>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [sections, setSections] = useState<Section[]>([]);

  const register = useCallback((title: string, y: number) => {
    setSections((prev) => {
      const existing = prev.find((section) => section.title === title);
      if (existing?.y === y) return prev;
      return [...prev.filter((section) => section.title !== title), { title, y }].sort(
        (a, b) => a.y - b.y
      );
    });
  }, []);

  const unregister = useCallback((title: string) => {
    setSections((prev) => prev.filter((section) => section.title !== title));
  }, []);

  const scrollToSection = (title: string) => {
    const section = sections.find((candidate) => candidate.title === title);
    if (section) {
      scrollViewRef.current?.scrollTo({ y: section.y, animated: false });
    }
  };

  return (
    <SectionIndexContext.Provider value={{ sections, register, unregister, scrollToSection }}>
      <ScrollView ref={scrollViewRef} {...props} />
    </SectionIndexContext.Provider>
  );
}

export function SectionIndex() {
  const context = useContext(SectionIndexContext);
  if (!context) return null;

  return (
    <View style={styles.index}>
      {context.sections.map(({ title }) => (
        <TouchableOpacity
          key={title}
          accessibilityRole="button"
          accessibilityLabel={`Jump to ${title}`}
          onPress={() => context.scrollToSection(title)}
          style={styles.chip}>
          <Text style={styles.chipText}>{title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SectionHeading({ title }: { title: string }) {
  const context = useContext(SectionIndexContext);
  const register = context?.register;
  const unregister = context?.unregister;

  useEffect(() => {
    return () => unregister?.(title);
  }, [title, unregister]);

  return (
    <View onLayout={(event) => register?.(title, event.nativeEvent.layout.y)}>
      <HeadingText>{title}</HeadingText>
    </View>
  );
}

const styles = StyleSheet.create({
  // Wraps instead of scrolling horizontally so every chip stays on screen for e2e taps.
  index: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.tintColor,
  },
  chipText: { color: Colors.tintColor, fontSize: 12 },
});
