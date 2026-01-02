import { Image, SFSymbolEffectType } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const SF_SYMBOLS = [
  'star.fill',
  'heart.fill',
  'bell.fill',
  'bolt.fill',
  'flame.fill',
  'leaf.fill',
  'drop.fill',
  'cloud.fill',
];

function EffectRow({
  title,
  effect,
  scope,
  repeat = -1,
}: {
  title: string;
  effect: SFSymbolEffectType;
  scope?: 'by-layer' | 'whole-symbol';
  repeat?: number;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {SF_SYMBOLS.map((symbol, index) => (
          <Image
            key={index}
            source={`sf:${symbol}`}
            autoplay
            sfEffect={{ effect, scope, repeat }}
            style={styles.symbol}
          />
        ))}
      </View>
    </View>
  );
}

function ReplaceTransitionExample() {
  const [index, setIndex] = useState(0);
  const symbols = ['sf:bell', 'sf:bell.slash', 'sf:bell.badge', 'sf:bell.and.waves.left.and.right'];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Replace Transition (tap to change)</Text>
      <Pressable onPress={() => setIndex((i) => (i + 1) % symbols.length)}>
        <Image
          source={symbols[index]}
          transition={{ effect: 'sf:replace/down-up', duration: 300 }}
          style={styles.largeSymbol}
        />
      </Pressable>
      <Text style={styles.subtitle}>Current: {symbols[index]}</Text>
    </View>
  );
}

function DrawEffectExample() {
  const [isDrawn, setIsDrawn] = useState(true);
  const symbols = ['signature', 'pencil.and.scribble', 'lasso', 'scribble.variable'];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Draw On/Off (iOS 26+) - tap to toggle</Text>
      <Pressable onPress={() => setIsDrawn((d) => !d)}>
        <View style={styles.row}>
          {symbols.map((symbol, index) => (
            <Image
              key={`${symbol}`}
              source={`sf:${symbol}`}
              autoplay
              sfEffect={{
                effect: isDrawn ? 'draw/on' : 'draw/off',
                scope: 'by-layer',
              }}
              style={styles.largeSymbol}
            />
          ))}
        </View>
      </Pressable>
      <Text style={styles.subtitle}>Effect: {isDrawn ? 'draw/on' : 'draw/off'}</Text>
    </View>
  );
}

function FontWeightComparisonExample() {
  const weights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Font Weights (style.fontWeight)</Text>
      <View style={styles.row}>
        {weights.map((weight) => (
          <View key={weight} style={styles.effectContainer}>
            <Image source="sf:circle.fill" style={[styles.symbol, { fontWeight: weight }]} />
            <Text style={styles.label}>{weight}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.subtitle}>SF Symbols respect fontWeight style property</Text>
    </View>
  );
}

function MultipleEffectsExample() {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Multiple Effects (Array)</Text>
      <View style={styles.row}>
        <View style={styles.effectContainer}>
          <Image
            source="sf:waveform.path.ecg"
            autoplay
            sfEffect={[
              { effect: 'pulse', repeat: -1 },
              { effect: 'scale', repeat: -1 },
            ]}
            style={styles.largeSymbol}
          />
          <Text style={styles.label}>pulse + scale</Text>
        </View>
        <View style={styles.effectContainer}>
          <Image
            source="sf:antenna.radiowaves.left.and.right"
            autoplay
            sfEffect={['bounce', { effect: 'variable-color', repeat: -1 }]}
            style={styles.largeSymbol}
          />
          <Text style={styles.label}>bounce + variable-color</Text>
        </View>
      </View>
    </View>
  );
}

function StringEffectExample() {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Simple String Effect</Text>
      <View style={styles.row}>
        <View style={styles.effectContainer}>
          <Image source="sf:hand.thumbsup.fill" autoplay sfEffect="bounce" style={styles.symbol} />
          <Text style={styles.label}>"bounce"</Text>
        </View>
        <View style={styles.effectContainer}>
          <Image source="sf:heart.fill" autoplay sfEffect="pulse" style={styles.symbol} />
          <Text style={styles.label}>"pulse"</Text>
        </View>
        <View style={styles.effectContainer}>
          <Image source="sf:star.fill" autoplay sfEffect="scale" style={styles.symbol} />
          <Text style={styles.label}>"scale"</Text>
        </View>
        <View style={styles.effectContainer}>
          <Image
            source="sf:wifi"
            autoplay
            sfEffect="variable-color/iterative"
            style={styles.symbol}
          />
          <Text style={styles.label}>"variable-color"</Text>
        </View>
      </View>
    </View>
  );
}

function TintColorExample() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>With Tint Colors</Text>
      <View style={styles.row}>
        {colors.map((color, index) => (
          <Image
            key={index}
            source={`sf:${SF_SYMBOLS[index % SF_SYMBOLS.length]}`}
            autoplay
            sfEffect={{ effect: 'bounce', repeat: -1 }}
            tintColor={color}
            style={styles.symbol}
          />
        ))}
      </View>
    </View>
  );
}

function FontWeightExample() {
  const weights = ['100', '300', '400', '600', '800', '900'] as const;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Font Weights</Text>
      <View style={styles.row}>
        {weights.map((weight) => (
          <View key={weight} style={styles.effectContainer}>
            <Image
              source="sf:star.fill"
              autoplay
              sfEffect={{ effect: 'pulse', repeat: -1 }}
              style={[styles.symbol, { fontWeight: weight }]}
            />
            <Text style={styles.label}>{weight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ImageSFSymbolScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>SF Symbol Effects (iOS 17+)</Text>

      <StringEffectExample />
      <ReplaceTransitionExample />
      <DrawEffectExample />
      <MultipleEffectsExample />
      <TintColorExample />
      <FontWeightComparisonExample />
      <FontWeightExample />

      <EffectRow title="Bounce" effect="bounce" />
      <EffectRow title="Bounce Up" effect="bounce/up" />
      <EffectRow title="Bounce Down" effect="bounce/down" />
      <EffectRow title="Pulse" effect="pulse" />
      <EffectRow title="Pulse (by-layer)" effect="pulse" scope="by-layer" />
      <EffectRow title="Scale" effect="scale" />
      <EffectRow title="Scale Up" effect="scale/up" />
      <EffectRow title="Scale Down" effect="scale/down" />
      <EffectRow title="Variable Color" effect="variable-color" />
      <EffectRow title="Variable Color (iterative)" effect="variable-color/iterative" />
      <EffectRow title="Variable Color (cumulative)" effect="variable-color/cumulative" />

      <Text style={styles.header}>iOS 18+ Effects</Text>
      <EffectRow title="Wiggle" effect="wiggle" />
      <EffectRow title="Rotate" effect="rotate" />
      <EffectRow title="Breathe" effect="breathe" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#eee',
    marginTop: 10,
    marginBottom: 5,
  },
  section: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbol: {
    width: 36,
    height: 36,
    tintColor: '#fff',
  },
  largeSymbol: {
    width: 64,
    height: 64,
    tintColor: '#fff',
  },
  effectContainer: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});
