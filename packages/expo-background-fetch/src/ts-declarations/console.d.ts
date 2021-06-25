interface Console {
  warn(message?: any, ...optionalParams: any[]): void;
}

declare let console: Console;
