import { categorizeAsync, generateAsync, summarizeAsync } from 'expo-ai';
import { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { AIResultPanel, describeGeneration, SOURCE_TEXT, styles, useAIAction } from './shared';

const TICKET_CATEGORIES = ['bug report', 'billing question', 'feature request', 'praise'] as const;

export default function TextScreen() {
  const { result, error, run, buttonProps } = useAIAction();
  const [input, setInput] = useState(SOURCE_TEXT);

  const generate = () =>
    run('generate', async () => describeGeneration(await generateAsync(input)));

  const summarize = () =>
    run('summarize', async () =>
      describeGeneration(await summarizeAsync(input, { length: 'short' }))
    );

  const categorize = () =>
    run('categorize', async () =>
      describeGeneration(await categorizeAsync(input, { categories: TICKET_CATEGORIES }))
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AIResultPanel result={result} error={error} />

      <BodyText color="secondary" style={styles.description}>
        All three calls read the input below, so their results are comparable. generateAsync answers
        it, summarizeAsync condenses it, and categorizeAsync picks one of:{' '}
        {TICKET_CATEGORIES.join(', ')}.
      </BodyText>

      <TextInput
        style={styles.textInput}
        placeholder="Prompt or source text"
        placeholderTextColor={Colors.secondaryText}
        multiline
        value={input}
        onChangeText={setInput}
      />

      <Button
        {...buttonProps('generate', !input.trim())}
        onPress={generate}
        title="Generate a reply"
      />
      <Button {...buttonProps('summarize', !input.trim())} onPress={summarize} title="Summarize" />
      <Button
        {...buttonProps('categorize', !input.trim())}
        onPress={categorize}
        title="Categorize"
      />
    </ScrollView>
  );
}
