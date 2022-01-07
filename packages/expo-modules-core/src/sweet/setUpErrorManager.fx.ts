import Platform from '../Platform';
import { EventEmitter } from '../EventEmitter';
import NativeErrorManager from './NativeErrorManager';

if (__DEV__ && Platform.OS === 'android') {
  const onNewException = 'SweetErrorManager.onNewException';
  const eventEmitter = new EventEmitter(NativeErrorManager);

  eventEmitter.addListener(onNewException, ({ message }: { message: string }) => {
    console.error(message);
  });
}
