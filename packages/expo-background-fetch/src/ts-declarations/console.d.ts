interface Console {
  warn(message?: any, ...optionalParams: any[]): void;
}

declare var Console: {
  prototype: Console;
  new(): Console;
};

declare var console: Console;
