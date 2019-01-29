// Optional flow type
// import { RemoteMessage } from '../../build';
type RemoteMessage = any;

export default async (message: RemoteMessage): Promise<void> => {
  // handle your message

  console.log('Background.messaging', message);
};
