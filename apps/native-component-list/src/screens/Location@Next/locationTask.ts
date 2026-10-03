import { defineLocationTask } from 'expo-location/next';

let listener: ((message: string) => void) | null = null;

export function setLocationTaskListener(next: ((message: string) => void) | null) {
  listener = next;
}

defineLocationTask({
  onPosition: (position) => listener?.(JSON.stringify(position, null, 2)),
  onError: (error) => listener?.(`Error: ${error.message}`),
});
