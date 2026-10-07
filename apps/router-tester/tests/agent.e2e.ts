import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

test('the agent opens a nested dynamic route', async ({ agent, app, device, screen }) => {
  await app.open();
  await device.openLink('router-tester://params');

  await agent.act('open the nested params case for path 456 with the x and y query params');

  await expect(screen.getByText(/^Nested Param:/)).toHaveText(
    'Nested Param: {"path":"456","nested":"aaa","x":"1","y":"2"}'
  );
});
