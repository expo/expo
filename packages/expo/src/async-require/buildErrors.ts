import { withoutANSIColorStyles } from '@expo/log-box/utils';

export class HMRMetroBuildError extends Error {
  public originalMessage: string;

  constructor(message: string = 'Unknown Metro Error', type?: string, cause?: Error) {
    super(message);
    this.name = type || 'BuildError';
    this.cause = cause;
    this.originalMessage = [type, message].filter(Boolean).join(': ');
    this.message = withoutANSIColorStyles(message);
    this.stack = '';
  }
}
