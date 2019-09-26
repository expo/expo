interface Console {
  error(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
}

declare var Console: {
  prototype: Console;
  new (): Console;
};

declare var console: Console;
