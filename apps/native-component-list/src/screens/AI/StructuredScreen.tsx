import { generateAsync, schema } from 'expo-ai';
import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { AIResultPanel, describeGeneration, InputBlock, styles, useAIAction } from './shared';

const TRIP_PROMPT = 'Plan a three day trip to Kyoto in April.';

const TRIP_SCHEMA = schema.object({
  city: schema.string({ description: 'The city the plan is for' }),
  days: schema.integer({ description: 'How many days the plan covers', minimum: 1, maximum: 5 }),
  season: schema.enum(['spring', 'summer', 'autumn', 'winter']),
  highlights: schema.array(schema.string({ description: 'One place to visit' }), { maxItems: 3 }),
  rainGearAdvised: schema.optional(schema.boolean()),
});

export default function StructuredScreen() {
  const { outcome, pending, run, buttonProps } = useAIAction();

  const generateStructured = () =>
    run('structured', async () =>
      describeGeneration(await generateAsync(TRIP_PROMPT, { schema: TRIP_SCHEMA }))
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <BodyText color="secondary" style={styles.description}>
        Passing a schema to generateAsync returns a typed object that matches it, not free text.
      </BodyText>

      <InputBlock label="prompt">{TRIP_PROMPT}</InputBlock>
      <InputBlock label="schema">{JSON.stringify(TRIP_SCHEMA, null, 2)}</InputBlock>

      <Button
        {...buttonProps('structured')}
        onPress={generateStructured}
        title="Generate a trip plan"
      />

      <AIResultPanel outcome={outcome} dimmed={pending !== null} />
    </ScrollView>
  );
}
