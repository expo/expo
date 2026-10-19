const OPTIONS_OVERRIDES = Symbol();

type DescriptorWithOptionsOverrides<Options extends object> = {
  [OPTIONS_OVERRIDES]?: Options;
};

export function withOptionsOverrides<Descriptor extends object, Options extends object>(
  descriptor: Descriptor,
  overrides: Options | undefined
): Descriptor {
  return Object.assign(descriptor, { [OPTIONS_OVERRIDES]: overrides });
}

export function getOptionsOverrides<Options extends object>(
  descriptor: object
): Options | undefined {
  return hasOptionsOverrides<Options>(descriptor) ? descriptor[OPTIONS_OVERRIDES] : undefined;
}

function hasOptionsOverrides<Options extends object>(
  descriptor: object
): descriptor is DescriptorWithOptionsOverrides<Options> {
  return OPTIONS_OVERRIDES in descriptor;
}
