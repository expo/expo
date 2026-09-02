/** @jest-environment jsdom */
import { render, waitFor } from '@testing-library/react';

import { ActivityContents } from '../ActivityContents';

test('restores the child hidden by Activity with display: none !important', async () => {
  const result = render(
    <ActivityContents mode="visible">
      <span>content</span>
    </ActivityContents>
  );
  const outer = result.container.querySelector<HTMLDivElement>('div')!;
  const activityChild = outer.querySelector<HTMLDivElement>('div')!;

  result.rerender(
    <ActivityContents mode="hidden">
      <span>content</span>
    </ActivityContents>
  );

  // React hides the Activity subtree with `display: none !important`. The
  // observer must clear it, including the `important` priority.
  await waitFor(() => expect(activityChild.style.display).toBe('contents'));
  expect(activityChild.style.getPropertyPriority('display')).toBe('');
});

test('restores Activity display changes and disconnects its observer', async () => {
  const disconnect = jest.spyOn(MutationObserver.prototype, 'disconnect');
  const result = render(
    <ActivityContents mode="visible">
      <span>content</span>
    </ActivityContents>
  );
  const outer = result.container.querySelector<HTMLDivElement>('div')!;
  const activityChild = outer.querySelector<HTMLDivElement>('div')!;

  expect(outer.style.display).toBe('contents');
  expect(activityChild.style.display).toBe('contents');

  activityChild.style.display = 'none';

  await waitFor(() => expect(activityChild.style.display).toBe('contents'));

  const disconnectCount = disconnect.mock.calls.length;
  result.unmount();
  expect(disconnect).toHaveBeenCalledTimes(disconnectCount + 1);
  disconnect.mockRestore();
});
