import { defineGeofencingTask, type GeofencingEvent } from 'expo-location/next';

export type GeofencingTaskEntry = { event: GeofencingEvent } | { error: string };

let listener: ((entry: GeofencingTaskEntry) => void) | null = null;

export function setGeofencingTaskListener(next: ((entry: GeofencingTaskEntry) => void) | null) {
  listener = next;
}

defineGeofencingTask({
  onEvent: (event) => listener?.({ event }),
  onError: (error) => listener?.({ error: error.message }),
});
