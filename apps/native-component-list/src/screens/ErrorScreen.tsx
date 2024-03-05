import { Button } from 'react-native';

import { Page, Section } from '../components/Page';

export default function ErrorScreen() {
  return (
    <Page>
      <Section title="Errors">
        <Button
          title="JavaScript error"
          onPress={() => {
            // Should present a full screen error message that can be dismissed.
            const foo = {};
            // @ts-ignore: should error out
            const b = foo.bar.lol;
            console.log(b);
          }}
        />
        <Button
          title="Console error"
          onPress={() => {
            // Should present a toast.
            console.error(new Error('Hello'));
          }}
        />
      </Section>
    </Page>
  );
}

ErrorScreen.navigationOptions = {
  title: 'Errors',
};
