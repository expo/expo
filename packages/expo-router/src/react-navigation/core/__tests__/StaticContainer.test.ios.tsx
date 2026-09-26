import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { StaticContainer } from '../StaticContainer';

test("doesn't update element if no props changed", async () => {
  expect.assertions(2);

  const Test = ({ label }: any) => {
    return <Text>{label}</Text>;
  };

  const root = await render(
    <StaticContainer count={42}>
      <Test label="first" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      first
    </Text>
  `);

  await root.rerender(
    <StaticContainer count={42}>
      <Test label="second" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      first
    </Text>
  `);
});

test('updates element if any props changed', async () => {
  expect.assertions(2);

  const Test = ({ label }: any) => {
    return <Text>{label}</Text>;
  };

  const root = await render(
    <StaticContainer count={42}>
      <Test label="first" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      first
    </Text>
  `);

  await root.rerender(
    <StaticContainer count={123}>
      <Test label="second" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      second
    </Text>
  `);
});

test('updates element if any props are added', async () => {
  expect.assertions(2);

  const Test = ({ label }: any) => {
    return <Text>{label}</Text>;
  };

  const root = await render(
    <StaticContainer count={42}>
      <Test label="first" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      first
    </Text>
  `);

  await root.rerender(
    <StaticContainer count={42} moreCounts={12}>
      <Test label="second" />
    </StaticContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      second
    </Text>
  `);
});
