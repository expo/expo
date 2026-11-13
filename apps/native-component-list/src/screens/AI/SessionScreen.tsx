import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import {
  AIResultPanel,
  buttonLayout,
  describeGeneration,
  describeSession,
  InputBlock,
  StatusRow,
  styles,
  useAIAction,
  useSession,
} from './shared';

const SESSION_INSTRUCTIONS = 'You are terse. Answer in one short sentence.';
const FIRST_TURN = 'My favourite colour is teal. Acknowledge it.';
const SECOND_TURN = 'Which colour did I name? Answer with the colour only.';

export default function SessionScreen() {
  const { outcome, pending, run, showResult, buttonProps } = useAIAction();
  const { session, create, dispose } = useSession(SESSION_INSTRUCTIONS);

  const createSession = () => run('session', async () => describeSession(await create()));

  const runTwoTurns = () =>
    run('turns', async () => {
      if (!session) throw new Error('Create a session first.');
      const first = await session.generateAsync(FIRST_TURN);
      const second = await session.generateAsync(SECOND_TURN);
      return {
        body: [
          `Q: ${FIRST_TURN}`,
          `A: ${first.value}`,
          '',
          `Q: ${SECOND_TURN}`,
          `A: ${second.value}`,
        ].join('\n'),
        meta: describeGeneration(second).meta,
      };
    });

  const disposeSession = () => {
    dispose();
    showResult('session.dispose', 'Session disposed.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <BodyText color="secondary" style={styles.description}>
        A session remembers earlier turns, so it can answer the second question from the first.
      </BodyText>

      <InputBlock label="instructions">{SESSION_INSTRUCTIONS}</InputBlock>
      <InputBlock label="turn 1">{FIRST_TURN}</InputBlock>
      <InputBlock label="turn 2">{SECOND_TURN}</InputBlock>

      <StatusRow
        tone={session ? 'success' : 'tertiary'}
        label={session ? 'Session ready' : 'No session'}
      />

      <Button {...buttonProps('session')} onPress={createSession} title="Create session" />
      <Button {...buttonProps('turns', !session)} onPress={runTwoTurns} title="Run two turns" />
      <Button
        {...buttonLayout}
        disabled={!session || pending !== null}
        onPress={disposeSession}
        title="Dispose session"
      />

      <AIResultPanel outcome={outcome} dimmed={pending !== null} />
    </ScrollView>
  );
}
