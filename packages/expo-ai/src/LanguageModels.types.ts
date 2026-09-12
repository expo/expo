/**
 * The supported JSON Schema subset. Unknown keywords reject before generation.
 * Objects are closed. Required fields must name declared properties. Numeric
 * bounds are inclusive. Null, unions, references, and string patterns are not
 * supported yet.
 * @experimental
 */
export type ModelSchema = { readonly description?: string } & (
  | { readonly type: 'string'; readonly enum?: readonly [string, ...string[]] }
  | { readonly type: 'number'; readonly minimum?: number; readonly maximum?: number }
  | { readonly type: 'integer'; readonly minimum?: number; readonly maximum?: number }
  | { readonly type: 'boolean' }
  | {
      readonly type: 'array';
      readonly items: ModelSchema;
      readonly minItems?: number;
      readonly maxItems?: number;
    }
  | {
      readonly type: 'object';
      readonly properties: Readonly<Record<string, ModelSchema>>;
      readonly required?: readonly string[];
      readonly additionalProperties: false;
    }
);

/** A closed object schema used for tool arguments. */
export type ObjectSchema = Extract<ModelSchema, { readonly type: 'object' }>;

type RequiredKeys<S> = S extends {
  readonly required: readonly (infer K extends string)[];
}
  ? K
  : never;

/**
 * Infers the validated result of a literal schema, including optional fields.
 * @hidden
 */
export type InferSchema<S> = S extends { readonly enum: readonly (infer V)[] }
  ? V
  : S extends { readonly type: 'string' }
    ? string
    : S extends { readonly type: 'number' | 'integer' }
      ? number
      : S extends { readonly type: 'boolean' }
        ? boolean
        : S extends { readonly type: 'array'; readonly items: infer I }
          ? InferSchema<I>[]
          : S extends { readonly type: 'object'; readonly properties: infer P }
            ? {
                -readonly [K in keyof P as K extends RequiredKeys<S> ? K : never]: InferSchema<
                  P[K]
                >;
              } & {
                -readonly [K in keyof P as K extends RequiredKeys<S> ? never : K]?: InferSchema<
                  P[K]
                >;
              }
            : never;

/** Support for a feature on the currently selected provider and model. */
export type CapabilitySupport = 'supported' | 'unsupported' | 'unknown';

/** Availability is provider- and model-specific, not an OS-version guarantee. */
export type ModelCapabilities = {
  readonly provider: string;
  readonly model: string | null;
  readonly execution: 'on-device';
  readonly constrainedOutput: CapabilitySupport;
  readonly runtimeToolDeclarations: CapabilitySupport;
  readonly images: CapabilitySupport;
  /** Native OCR and barcode tools for labeled local images. Omitted by older providers. */
  readonly imageTools?: CapabilitySupport;
  readonly contextTokens: number | null;
};

/** Requirements are checked during availability, preparation, and session creation. */
export type ModelRequirements = {
  /** Selects the system provider. Downloadable third-party backends are not included. */
  provider?: 'system';
  /** Explicit language support requirements. Android currently reports language-support-unknown when supplied. */
  inputLanguages?: readonly string[];
  /** Explicit output language requirement. Omit on Android while support cannot be verified. */
  outputLanguage?: string;
  requires?: readonly ('constrainedOutput' | 'runtimeToolDeclarations' | 'images' | 'imageTools')[];
};

/** Readiness of the requested local model. Checking readiness never starts a download. */
export type ModelAvailability =
  | { status: 'available'; capabilities: ModelCapabilities }
  | {
      status: 'downloadable' | 'downloading' | 'not-ready';
      progress: number | null;
    }
  | { status: 'unavailable'; reason: string };

/** A tool handler's request identity and cooperative cancellation signal. */
export type ToolContext = {
  readonly callId: string;
  readonly signal: AbortSignal;
};

/** Complete, validated arguments supplied to the application's action interceptor. */
export type ToolCall = ToolContext & {
  readonly name: string;
  readonly arguments: unknown;
};

/**
 * An application tool. Arguments validate before execution. Return ordinary
 * JSON-compatible data; strings remain text and other values are serialized.
 * Unsupported values reject the generation. Both synchronous and asynchronous
 * handlers are supported. Honor the signal when possible; cancellation cannot
 * undo completed effects.
 * @experimental
 * @hidden
 */
export type ToolDefinition<S extends ObjectSchema = ObjectSchema> = S extends ObjectSchema
  ? {
      readonly name: string;
      readonly description: string;
      readonly inputSchema: S;
      execute(input: InferSchema<S>, context: ToolContext): unknown | Promise<unknown>;
    }
  : never;

/** Schema-derived definitions preserve the arguments of each tool in a list. @hidden */
export type ToolDefinitions<Schemas extends readonly ObjectSchema[]> = {
  readonly [K in keyof Schemas]: ToolDefinition<Schemas[K]>;
};

/** Controls one generation and all model/tool work it initiates. */
export type RequestOptions = {
  /** Local image files. Up to 8; labels default to image-1, image-2, and so on. Apple image tools support iOS 26; model vision requires iOS 27 and model support. */
  images?: readonly ImageInput[];
  signal?: AbortSignal;
  /** Optional overall deadline in milliseconds, including tool handlers and approval. No library deadline applies when omitted. */
  timeoutMs?: number;
  /** Maximum handler starts. Defaults to 4; integers 0–16. Applies to native and compatibility tools. */
  maximumToolCalls?: number;
  /** Maximum library model calls, including repairs; integers 1–32. Compatibility loops default to 8. Rejects with native tools because their internal model calls cannot be counted. */
  maximumSteps?: number;
  /** Maximum additional library validation repair attempts per response; integers 0–3, default 1. Does not select a weaker implementation. Provider failures and tool handlers are never retried. */
  maximumRetries?: number;
  /** Maximum output tokens per model call. Unsupported explicit options reject. */
  maximumOutputTokens?: number;
  /** Return true to allow a validated tool call, or false to end the generation without executing it. */
  beforeTool?: (call: ToolCall) => boolean | Promise<boolean>;
};

/** An app-provided image file. Network and data URLs are not accepted. */
export type ImageInput = {
  readonly uri: string;
  /** Unique within the request, 1–128 characters without control characters. Tools refer to this label. */
  readonly label?: string;
};

/** A request for a final schema-validated value. */
export type StructuredRequest<S extends ModelSchema> = RequestOptions & {
  schema: S;
};

/** Plain text requests cannot contain structured generation options. */
export type TextRequestOptions = RequestOptions & {
  schema?: never;
};

/** A complete successful result. Validation checks structure, not factual accuracy. */
export type GenerationResult<T> = {
  value: T;
  provider: string;
  model: string | null;
  format: 'text' | 'constrained' | 'validated';
  /** Unknown measurements remain null rather than being estimated. */
  usage: GenerationUsage;
};

/** Provider-reported token counts. Unknown measurements are null; optional fields are omitted when unavailable. */
export type GenerationUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  /** Cached tokens included in inputTokens, when reported by the provider. */
  cachedInputTokens?: number | null;
  /** Reasoning tokens included in outputTokens, when reported by the provider. */
  reasoningTokens?: number | null;
  /** Tokens in the final model call's completed context. This is not billed or per-request input usage. */
  contextTokens?: number | null;
};

/**
 * Text events are complete snapshots. Structured snapshots are raw text until
 * the final result validates; partially parsed objects are not exposed yet.
 */
export type GenerationEvent<T> =
  | { type: 'text'; text: string }
  | { type: 'tool-start'; callId: string; toolName: string }
  | { type: 'tool-end'; callId: string; toolName: string }
  | { type: 'result'; result: GenerationResult<T> };

/** Options used to create a session. */
export type SessionOptions<Schemas extends readonly ObjectSchema[] = readonly ObjectSchema[]> =
  ModelRequirements & {
    instructions?: string;
    tools?: ToolDefinitions<Schemas>;
  };

/** A provisional, cumulative text snapshot. Replace the previous preview. */
export type GenerationUpdate = { readonly text: string };

/** Options shared by one-shot requests. */
export type GenerationUpdateOptions = {
  /** Receives provisional full text snapshots; the promise provides the validated final result. */
  onUpdate?: (update: GenerationUpdate) => void;
};

/** Options for one independent plain text task. */
export type GenerateOptions<Schemas extends readonly ObjectSchema[] = readonly ObjectSchema[]> =
  SessionOptions<Schemas> & TextRequestOptions & GenerationUpdateOptions;

/** Options for one independent task with a final schema-validated value. */
export type StructuredGenerateOptions<
  S extends ModelSchema,
  Schemas extends readonly ObjectSchema[] = readonly ObjectSchema[],
> = SessionOptions<Schemas> & StructuredRequest<S> & GenerationUpdateOptions;
