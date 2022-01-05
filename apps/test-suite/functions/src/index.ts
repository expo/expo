import * as functions from 'firebase-functions';

export class ArgumentError extends functions.https.HttpsError {
  constructor(message: string) {
    super('invalid-argument', message);
    this.name = 'ArgumentError';
  }
}

exports.echoMessage = functions.https.onCall((data) => {
  const { message } = data;
  if (!message) {
    throw new ArgumentError(`Hi 👋, you did not specify a message`);
  }
  return {
    message: `Hi 👋, you said: ${message}`,
  };
});
