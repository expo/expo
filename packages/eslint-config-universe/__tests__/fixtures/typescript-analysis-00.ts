type T = {
  a?: {
    b?: {
      c: string;
      method?: () => void;
    };
  };
};

export function myFunc(foo: T | null) {
  return foo && foo.a && foo.a.b && foo.a.b.c;
}