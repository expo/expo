const CODEGEN_NAME = /\b(?:codegenNativeComponent|codegenNativeCommands|TurboModule)\b/;

export const TURBO_MODULE_SPEC =
  /^[\t ]*(?:export[\t ]+)?interface[\t ]+[A-Za-z_$][\w$]*[\t \n]+extends[\t \n]+TurboModule\b/m;

/** Cheap prerequisite for installing the authoritative native Codegen eligibility plugin. */
export function mayContainReactNativeCodegen(source: string): boolean {
  return CODEGEN_NAME.test(source);
}
