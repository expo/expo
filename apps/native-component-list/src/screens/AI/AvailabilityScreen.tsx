import {
  getAvailabilityAsync,
  prepareAsync,
  type ModelAvailability,
  type ModelRequirements,
} from 'expo-ai';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import TitledSwitch from '../../components/TitledSwitch';
import {
  AIResultPanel,
  formatNullable,
  InputBlock,
  StatusRow,
  styles,
  ThemedTextInput,
  useAIAction,
  type ResultContent,
  type StatusTone,
} from './shared';

type RequiredFeature = NonNullable<ModelRequirements['requires']>[number];

const REQUIRED_FEATURES = [
  'constrainedOutput',
  'runtimeToolDeclarations',
  'images',
  'imageTools',
] as const satisfies readonly RequiredFeature[];

const STATUS_TONES: Record<ModelAvailability['status'], StatusTone> = {
  available: 'success',
  downloadable: 'warning',
  downloading: 'warning',
  'not-ready': 'warning',
  unavailable: 'danger',
};

function describeAvailability(availability: ModelAvailability): string {
  switch (availability.status) {
    case 'available': {
      const { capabilities } = availability;
      return [
        'status: available',
        `provider: ${capabilities.provider}`,
        `model: ${formatNullable(capabilities.model)}`,
        `execution: ${capabilities.execution}`,
        `constrainedOutput: ${capabilities.constrainedOutput}`,
        `runtimeToolDeclarations: ${capabilities.runtimeToolDeclarations}`,
        `images: ${capabilities.images}`,
        `imageTools: ${capabilities.imageTools ?? 'not reported by this provider'}`,
        `contextTokens: ${formatNullable(capabilities.contextTokens)}`,
      ].join('\n');
    }
    case 'unavailable':
      return `status: unavailable\nreason: ${availability.reason}`;
    default:
      return `status: ${availability.status}\nprogress: ${formatNullable(availability.progress)}`;
  }
}

/** Leaves blank controls out, because a blank language fails with ERR_OPTIONS_INVALID. */
function buildRequirements(
  requires: RequiredFeature[],
  inputLanguages: string,
  outputLanguage: string
): ModelRequirements {
  const languages = inputLanguages
    .split(',')
    .map((language) => language.trim())
    .filter(Boolean);
  const output = outputLanguage.trim();
  return {
    ...(requires.length > 0 ? { requires } : {}),
    ...(languages.length > 0 ? { inputLanguages: languages } : {}),
    ...(output ? { outputLanguage: output } : {}),
  };
}

function describeDownload(progress: number | null): string {
  return progress === null
    ? 'Download: progress unknown'
    : `Download: ${Math.round(progress * 100)}%`;
}

export default function AvailabilityScreen() {
  const { outcome, pending, run, buttonProps } = useAIAction();
  const [requires, setRequires] = useState<RequiredFeature[]>([]);
  const [inputLanguages, setInputLanguages] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('');
  const [availability, setAvailability] = useState<ModelAvailability | null>(null);
  const [download, setDownload] = useState<string | null>(null);

  const requirements = buildRequirements(requires, inputLanguages, outputLanguage);

  const setRequired = (feature: RequiredFeature, required: boolean) =>
    setRequires((current) =>
      required ? [...current, feature] : current.filter((item) => item !== feature)
    );

  const report = (latest: ModelAvailability): ResultContent => {
    setAvailability(latest);
    return { body: describeAvailability(latest), mono: true };
  };

  const checkAvailability = () => {
    setDownload(null);
    return run('availability', async () => report(await getAvailabilityAsync(requirements)));
  };

  useEffect(() => {
    checkAvailability();
  }, []);

  const prepare = (allowDownload: boolean) =>
    run(allowDownload ? 'prepare' : 'prepare-offline', async () => {
      setDownload('Download: no progress reported');
      const prepared = await prepareAsync({
        ...requirements,
        allowDownload,
        onProgress: (progress) => setDownload(describeDownload(progress)),
      });
      return report(prepared);
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={localStyles.heading}>Requirements</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        These controls build the requirements object that the calls below receive.
      </BodyText>

      {REQUIRED_FEATURES.map((feature) => (
        <TitledSwitch
          key={feature}
          title={feature}
          value={requires.includes(feature)}
          setValue={(required) => setRequired(feature, required)}
        />
      ))}

      <ThemedTextInput
        placeholder="inputLanguages, comma separated (en-GB, ja)"
        autoCapitalize="none"
        autoCorrect={false}
        value={inputLanguages}
        onChangeText={setInputLanguages}
      />

      <ThemedTextInput
        placeholder="outputLanguage"
        autoCapitalize="none"
        autoCorrect={false}
        value={outputLanguage}
        onChangeText={setOutputLanguage}
      />

      <InputBlock label="requirements">{JSON.stringify(requirements, null, 2)}</InputBlock>

      <HeadingText style={localStyles.heading}>Availability</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Reports whether the model is ready, and never starts a download.
      </BodyText>

      <StatusRow
        tone={availability ? STATUS_TONES[availability.status] : 'tertiary'}
        label={availability?.status ?? 'not checked'}
      />

      <Button
        {...buttonProps('availability')}
        onPress={checkAvailability}
        title="Check availability"
      />

      <HeadingText style={localStyles.heading}>Preparation</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Downloads the model if allowed; iOS manages its model in Settings instead.
      </BodyText>

      <Button
        {...buttonProps('prepare')}
        onPress={() => prepare(true)}
        title="Prepare and allow download"
      />
      <Button
        {...buttonProps('prepare-offline')}
        onPress={() => prepare(false)}
        title="Prepare without downloading"
      />

      <AIResultPanel outcome={outcome} dimmed={pending !== null} />

      {download && <BodyText style={styles.description}>{download}</BodyText>}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  heading: {
    marginBottom: 12,
  },
});
