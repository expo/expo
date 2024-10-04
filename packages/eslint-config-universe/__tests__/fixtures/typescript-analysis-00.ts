type T = {
  a?: {
    b?: {
      c: string;
      method?: () => void;
    };
  };
};

type T2 = {
  a?: {
    b: {
      c: string;
      method?: () => void;
    };
  };
};

export function myFunc(foo: T | null) {
  return foo && foo.a && foo.a.b && foo.a.b.c;
}

export function myFunc2(foo: T2 | null) {
  foo && foo.a && foo.a.b.method && foo.a.b.method();
}
