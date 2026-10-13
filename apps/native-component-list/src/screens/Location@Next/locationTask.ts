import { defineLocationTask } from 'expo-location/next';

import { appendBackgroundFixAsync } from './backgroundLocationStore';

let listener: ((message: string) => void) | null = null;

export function setLocationTaskListener(next: ((message: string) => void) | null) {
  listener = next;
}

defineLocationTask({
  onPosition: (position) => {
    appendBackgroundFixAsync(position);
    listener?.(JSON.stringify(position, null, 2));
  },
  onError: (error) => listener?.(`Error: ${error.message}`),
});
