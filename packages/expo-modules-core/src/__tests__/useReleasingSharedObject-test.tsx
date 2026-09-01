import { render } from '@testing-library/react-native';
import { Activity } from 'react';

import { useReleasingSharedObject } from '../hooks/useReleasingSharedObject';

let nextId = 1;
let current: FakeSharedObject | null = null;
const created: FakeSharedObject[] = [];

class FakeSharedObject {
  id = nextId++;
  released = false;

  constructor() {
    created.push(this);
  }

  release() {
    this.released = true;
  }
}

function Probe({ source = 'a' }: { source?: string }) {
  current = useReleasingSharedObject(() => new FakeSharedObject() as any, [source]);
  return null;
}

function App({ mode, source }: { mode: 'visible' | 'hidden'; source?: string }) {
  return (
    <Activity mode={mode}>
      <Probe source={source} />
    </Activity>
  );
}

beforeEach(() => {
  nextId = 1;
  current = null;
  created.length = 0;
});

it('creates a new object when <Activity> shows the tree again', () => {
  const { rerender } = render(<App mode="visible" />);
  expect(current?.released).toBe(false);

  rerender(<App mode="hidden" />);
  expect(current?.released).toBe(true);

  rerender(<App mode="visible" />);
  expect(current?.released).toBe(false);
  expect(created).toHaveLength(2);
});

it('releases the object when the component really unmounts', () => {
  const { unmount } = render(<App mode="visible" />);
  const object = current!;
  expect(object.released).toBe(false);

  unmount();
  expect(object.released).toBe(true);
  expect(created).toHaveLength(1);
});

it('keeps the same object while it stays visible', () => {
  const { rerender } = render(<App mode="visible" />);
  const object = current!;

  rerender(<App mode="visible" />);
  expect(current).toBe(object);
  expect(created).toHaveLength(1);
});

it('recreates the object when the dependencies change', () => {
  const { rerender } = render(<App mode="visible" source="a" />);
  const object = current!;

  rerender(<App mode="visible" source="b" />);
  expect(current).not.toBe(object);
  expect(object.released).toBe(true);
  expect(current?.released).toBe(false);
});
