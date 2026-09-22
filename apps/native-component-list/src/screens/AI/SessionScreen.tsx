import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { AIResultPanel, styles, useAIAction, useModelSession } from './shared';

const FIRST_TURN = 'My favourite colour is teal. Acknowledge it.';
const SECOND_TURN = 'Which colour did I name? Answer with the colour only.';

export default function SessionScreen() {
  const { result, error, pending, run, showResult, buttonProps } = useAIAction();
  const { session, setSession, createSession } = useModelSession(run);

  const runSessionTurns = () =>
    run('turns', async () => {
      if (!session) throw new Error('Create a session first.');
      const first = await session.generateAsync(FIRST_TURN);
      const second = await session.generateAsync(SECOND_TURN);
      return [
        `Q: ${FIRST_TURN}`,
        `A: ${first.value}`,
        '',
        `Q: ${SECOND_TURN}`,
        `A: ${second.value}`,
        '',
        'The second answer is only correct if the session kept the first turn.',
      ].join('\n');
    });

  const disposeSession = () => {
    setSession(null);
    showResult('Session disposed.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AIResultPanel result={result} error={error} />

      <BodyText color="secondary" style={styles.description}>
        A session keeps its turns, so the second question below can only be answered from the first.
        A session holds a native resource, which this screen releases when you replace it, dispose
        it, or leave the screen.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        {session ? 'A session is open.' : 'No session is open.'}
      </BodyText>

      <Button {...buttonProps('session')} onPress={createSession} title="Create session" />
      <Button {...buttonProps('turns', !session)} onPress={runSessionTurns} title="Run two turns" />
      <Button
        style={styles.button}
        disabled={!session || pending !== null}
        onPress={disposeSession}
        title="Dispose session"
      />
    </ScrollView>
  );
}
