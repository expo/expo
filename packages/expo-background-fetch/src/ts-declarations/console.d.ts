interface Console {
  warn(message?: any, ...optionalParams: any[]): void;
}

declare var console: Console;
