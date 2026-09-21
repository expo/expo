import {
  getAvailabilityAsync,
  prepareAsync,
  type ModelAvailability,
  type ModelRequirements,
} from 'expo-ai';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import TitledSwitch from '../../components/TitledSwitch';
import Colors from '../../constants/Colors';
import { AIResultPanel, formatNullable, styles, useAIAction } from './shared';

type RequiredFeature = NonNullable<ModelRequirements['requires']>[number];

const REQUIRED_FEATURES = [
  'constrainedOutput',
  'runtimeToolDeclarations',
  'images',
  'imageTools',
] as const satisfies readonly RequiredFeature[];

const NO_FEATURES: Record<RequiredFeature, boolean> = {
  constrainedOutput: false,
  runtimeToolDeclarations: false,
  images: false,
  imageTools: false,
};

type RequirementControls = {
  provider: boolean;
  features: Record<RequiredFeature, boolean>;
  inputLanguages: string;
  outputLanguage: string;
};

/** Tracks enough to tell "onProgress never ran" apart from "onProgress reported null". */
type ProgressReport = { calls: number; last: { value: number | null; at: number } | null };

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

/** Every unset control is omitted, so the echoed object is what the two calls receive. */
function buildRequirements({
  provider,
  features,
  inputLanguages,
  outputLanguage,
}: RequirementControls): ModelRequirements {
  const requires = REQUIRED_FEATURES.filter((feature) => features[feature]);
  // A blank language is rejected with ERR_OPTIONS_INVALID, so a trailing comma must not survive.
  const languages = inputLanguages
    .split(',')
    .map((language) => language.trim())
    .filter((language) => language.length > 0);
  const output = outputLanguage.trim();
  return {
    ...(provider ? { provider: 'system' as const } : {}),
    ...(languages.length > 0 ? { inputLanguages: languages } : {}),
    ...(output.length > 0 ? { outputLanguage: output } : {}),
    // An empty requires list behaves like no list at all, so omitting it is the honest echo.
    ...(requires.length > 0 ? { requires } : {}),
  };
}

function describeRequirements(requirements: ModelRequirements): string {
  return JSON.stringify(requirements, null, 2);
}

function describeProgress({ calls, last }: ProgressReport): string {
  if (!last) {
    return 'onProgress calls: 0\nThe callback never ran during this attempt.';
  }
  return [
    `onProgress calls: ${calls}`,
    `last raw value: ${formatNullable(last.value)}`,
    last.value === null
      ? 'The provider reported no percentage for that call.'
      : `That is ${Math.round(last.value * 100)}% of the download.`,
    `last call: #${calls} at ${new Date(last.at).toISOString().slice(11, 23)} UTC`,
  ].join('\n');
}

export default function AvailabilityScreen() {
  const { result, error, run, buttonProps } = useAIAction();
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [provider, setProvider] = useState(false);
  const [features, setFeatures] = useState(NO_FEATURES);
  const [inputLanguages, setInputLanguages] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('');

  const requirements = buildRequirements({ provider, features, inputLanguages, outputLanguage });

  const setFeature = (feature: RequiredFeature, value: boolean) =>
    setFeatures((current) => ({ ...current, [feature]: value }));

  const checkAvailability = () =>
    run('availability', async () => describeAvailability(await getAvailabilityAsync(requirements)));

  useEffect(() => {
    checkAvailability();
  }, []);

  const prepare = (allowDownload: boolean) =>
    run(allowDownload ? 'prepare' : 'prepare-offline', async () => {
      setProgress({ calls: 0, last: null });
      const availability = await prepareAsync({
        ...requirements,
        allowDownload,
        onProgress: (value) =>
          setProgress((previous) => ({
            calls: (previous?.calls ?? 0) + 1,
            last: { value, at: Date.now() },
          })),
      });
      return describeAvailability(availability);
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AIResultPanel result={result} error={error} />

      <HeadingText style={localStyles.heading}>Requirements</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        The controls below build one ModelRequirements object, which is checked during the
        availability check and during preparation. It reaches those two calls only, so the three
        buttons under Availability and Preparation read it and every other call on this screen runs
        without requirements.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        Each switch adds one capability to the requires list. A capability the provider does not
        report as "supported" makes availability come back "unavailable" with reason
        "unsupported-feature". A provider that already reports "unavailable" keeps its own reason,
        so this one appears only when the provider has not already refused.
      </BodyText>

      {REQUIRED_FEATURES.map((feature) => (
        <TitledSwitch
          key={feature}
          title={feature}
          value={features[feature]}
          setValue={(value) => setFeature(feature, value)}
        />
      ))}

      <BodyText color="secondary" style={styles.description}>
        provider has exactly one legal value, "system". The library validates the key and nothing
        more, because there is no second provider to choose between, so the switch below changes the
        object without changing any answer.
      </BodyText>

      <TitledSwitch title="provider: system" value={provider} setValue={setProvider} />

      <BodyText color="secondary" style={styles.description}>
        Input languages are comma separated, for example: en-GB, ja. Naming any input or output
        language on Android returns "unavailable" with reason "language-support-unknown", because ML
        Kit's Prompt API has no public supported-locale query. A device that cannot run the backend
        at all answers first with its own reason instead, such as "unsupported-os-version" below
        Android 8.0.
      </BodyText>

      <TextInput
        style={localStyles.languageInput}
        placeholder="inputLanguages, comma separated"
        placeholderTextColor={Colors.secondaryText}
        autoCapitalize="none"
        autoCorrect={false}
        value={inputLanguages}
        onChangeText={setInputLanguages}
      />

      <TextInput
        style={localStyles.languageInput}
        placeholder="outputLanguage"
        placeholderTextColor={Colors.secondaryText}
        autoCapitalize="none"
        autoCorrect={false}
        value={outputLanguage}
        onChangeText={setOutputLanguage}
      />

      <BodyText color="secondary" style={styles.description}>
        The report below is the object those two calls receive, printed exactly as it is sent. A
        control you leave unset is left out of it rather than sent empty, so an empty object means
        both calls run on the provider's own defaults.
      </BodyText>

      <View style={styles.resultContainer}>
        <Text style={styles.resultLabel}>Requirements:</Text>
        <MonoText containerStyle={styles.resultText}>{describeRequirements(requirements)}</MonoText>
      </View>

      <HeadingText style={localStyles.heading}>Availability</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Reports whether the requested model is ready, and never starts a download. Unsupported
        hardware, Apple Intelligence turned off, a browser without the Prompt API, and a missing
        native module all report status "unavailable" with a reason instead of failing.
      </BodyText>

      <Button
        {...buttonProps('availability')}
        onPress={checkAvailability}
        title="Check availability"
      />

      <HeadingText style={localStyles.heading}>Preparation</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Preparation is the only step that downloads the model, and the download is large. Android
        needs allowDownload: true and the app in the foreground. Apple manages its model in system
        Settings, so iOS can neither start the download here nor report its progress.
      </BodyText>

      <Button
        {...buttonProps('prepare')}
        onPress={() => prepare(true)}
        title="Prepare and allow download"
      />

      <BodyText color="secondary" style={styles.description}>
        Preparing without a download returns the current availability right away. That early return
        is one of the reasons onProgress can stay at zero calls.
      </BodyText>

      <Button
        {...buttonProps('prepare-offline')}
        onPress={() => prepare(false)}
        title="Prepare without downloading"
      />

      <BodyText color="secondary" style={styles.description}>
        The report below separates three cases that otherwise look identical: onProgress never ran,
        it ran and carried null because the provider does not know the percentage, and it ran with a
        real fraction. Values are printed exactly as they arrive.
      </BodyText>

      {progress && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Preparation progress:</Text>
          <MonoText containerStyle={styles.resultText}>{describeProgress(progress)}</MonoText>
        </View>
      )}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  heading: {
    marginBottom: 12,
  },
  languageInput: {
    marginBottom: 12,
    padding: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 3,
  },
});
