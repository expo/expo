import { categorizeAsync, generateAsync, summarizeAsync } from 'expo-ai';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import {
  AIResultPanel,
  describeGeneration,
  SOURCE_TEXT,
  styles,
  ThemedTextInput,
  useAIAction,
} from './shared';

const TICKET_CATEGORIES = ['bug report', 'billing question', 'feature request', 'praise'] as const;

export default function TextScreen() {
  const { outcome, pending, run, buttonProps } = useAIAction();
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
      <BodyText color="secondary" style={styles.description}>
        Each call reads the text below: generateAsync replies, summarizeAsync condenses, and
        categorizeAsync picks one of {TICKET_CATEGORIES.join(', ')}.
      </BodyText>

      <ThemedTextInput
        style={styles.promptInput}
        placeholder="Prompt or source text"
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

      <AIResultPanel outcome={outcome} dimmed={pending !== null} />
    </ScrollView>
  );
}
