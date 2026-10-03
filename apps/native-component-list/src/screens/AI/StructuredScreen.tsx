import { generateAsync, schema } from 'expo-ai';
import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { AIResultPanel, describeGeneration, styles, useAIAction } from './shared';

const TRIP_PROMPT = 'Plan a three day trip to Kyoto in April.';

const TRIP_SCHEMA = schema.object({
  city: schema.string({ description: 'The city the plan is for' }),
  days: schema.integer({ description: 'How many days the plan covers', minimum: 1, maximum: 5 }),
  season: schema.enum(['spring', 'summer', 'autumn', 'winter']),
  highlights: schema.array(schema.string({ description: 'One place to visit' }), { maxItems: 3 }),
  rainGearAdvised: schema.optional(schema.boolean()),
});

export default function StructuredScreen() {
  const { result, error, run, buttonProps } = useAIAction();

  const generateStructured = () =>
    run('structured', async () =>
      describeGeneration(await generateAsync(TRIP_PROMPT, { schema: TRIP_SCHEMA }))
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AIResultPanel result={result} error={error} />

      <BodyText color="secondary" style={styles.description}>
        A schema built with the schema helpers constrains the result to an object with a city, a day
        count from 1 to 5, a season, up to three highlights, and an optional rain-gear flag. A
        provider with constrained output decodes the schema directly and reports format:
        constrained, except the browser Prompt API, which cannot apply numeric bounds and so falls
        back for this schema even while it reports constrainedOutput: supported. Without constrained
        output the call falls back to validated prompting, reports format: validated, and rejects
        with ERR_VALIDATION_RETRIES_EXHAUSTED only once the repair attempts run out.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        Prompt: {TRIP_PROMPT}
      </BodyText>

      <Button
        {...buttonProps('structured')}
        onPress={generateStructured}
        title="Generate a trip plan"
      />
    </ScrollView>
  );
}
