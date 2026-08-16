import { render } from '@testing-library/react-native';
import { Activity, useEffect } from 'react';

import { useReleasingSharedObject } from '../hooks/useReleasingSharedObject';
import type { SharedObject } from '../ts-declarations/SharedObject';

type TestSharedObject = SharedObject & {
  release: jest.Mock;
};

function SharedObjectConsumer({
  createObject,
  onObject,
}: {
  createObject: () => TestSharedObject;
  onObject: (object: TestSharedObject) => void;
}) {
  const object = useReleasingSharedObject(createObject, []);

  useEffect(() => {
    onObject(object);
  }, [object]);

  return null;
}

describe(useReleasingSharedObject, () => {
  it('recreates the shared object when its React Activity becomes visible again', () => {
    const objects: TestSharedObject[] = [];
    const createObject = jest.fn(() => {
      const object = { release: jest.fn() } as unknown as TestSharedObject;
      objects.push(object);
      return object;
    });
    const onObject = jest.fn();
    const screen = render(
      <Activity mode="visible">
        <SharedObjectConsumer createObject={createObject} onObject={onObject} />
      </Activity>
    );
    const initialObject = objects[0]!;

    screen.rerender(
      <Activity mode="hidden">
        <SharedObjectConsumer createObject={createObject} onObject={onObject} />
      </Activity>
    );

    expect(initialObject.release).toHaveBeenCalledTimes(1);

    screen.rerender(
      <Activity mode="visible">
        <SharedObjectConsumer createObject={createObject} onObject={onObject} />
      </Activity>
    );
    const resumedObject = objects[1]!;

    expect(createObject).toHaveBeenCalledTimes(2);
    expect(onObject).toHaveBeenLastCalledWith(resumedObject);
    expect(resumedObject.release).not.toHaveBeenCalled();

    screen.unmount();

    expect(resumedObject.release).toHaveBeenCalledTimes(1);
  });
});
