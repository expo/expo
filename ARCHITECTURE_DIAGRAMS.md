# Architecture Diagram: Expo Modular Platform System

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPO APPLICATION LAYER                          │
│                     (Your AI Platform / Lyxbot App)                     │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       │ Uses Expo Modules API
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXPO MODULES CORE (JavaScript/TypeScript)            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  NativeModule.ts  │  EventEmitter.ts  │  SharedObject.ts       │   │
│  │  requireNativeModule.ts  │  PermissionsInterface.ts           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────┬───────────────────┬──────────────┘
                   │                   │                   │
        Android    │        iOS        │        Web        │
                   ▼                   ▼                   ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  ANDROID LAYER   │  │   iOS LAYER      │  │   WEB LAYER      │
    │                  │  │                  │  │                  │
    │  Kotlin/Java     │  │  Swift/Obj-C     │  │  TypeScript      │
    │                  │  │                  │  │  WebAssembly     │
    └─────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
              │                    │                     │
              │                    │                     │
              ▼                    ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  Android Native  │  │   iOS Native     │  │   Web APIs       │
    │  APIs & ML Kit   │  │  APIs & Core ML  │  │  & TensorFlow.js │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Detailed Module Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         YOUR MODULE (e.g., LyxBot)                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  JavaScript API Layer (src/)                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  index.ts                                                     │    │
│  │  ├─ export class LyxBot extends SharedObject                 │    │
│  │  ├─ export function initializeBot()                          │    │
│  │  └─ export const botEvents = new EventEmitter()              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                               │                                        │
│                               │ Bridge                                 │
│                               ▼                                        │
│  ┌────────────────┬──────────────────────┬────────────────┐          │
│  │   Android      │        iOS           │      Web       │          │
│  │   (Kotlin)     │      (Swift)         │  (TypeScript)  │          │
│  ├────────────────┼──────────────────────┼────────────────┤          │
│  │                │                      │                │          │
│  │ Module {       │  Module {            │ class LyxBot { │          │
│  │   Name="Bot"   │    Name("Bot")       │   // Web impl  │          │
│  │                │                      │   ...          │          │
│  │   AsyncFunction│    AsyncFunction     │ }              │          │
│  │     "process"  │      "process"       │                │          │
│  │                │                      │                │          │
│  │   Events(      │    Events(           │                │          │
│  │     "onReply") │      "onReply")      │                │          │
│  │ }              │  }                   │                │          │
│  └────────────────┴──────────────────────┴────────────────┘          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Platform Manager Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPO CLI - Platform Managers                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │ AndroidPlatformManager│  │ ApplePlatformManager  │
        └───────────┬────────────┘  └──────────┬───────────┘
                    │                          │
                    │                          │
        ┌───────────▼────────────┐  ┌─────────▼────────────┐
        │ AndroidDeviceManager   │  │ AppleDeviceManager   │
        │  ┌──────────────────┐  │  │  ┌─────────────────┐ │
        │  │ ADB Interface    │  │  │  │ simctl/devicectl│ │
        │  │ - adb.ts         │  │  │  │ - simctl.ts     │ │
        │  │ - emulator.ts    │  │  │  │ - devicectl.ts  │ │
        │  │ - getDevices.ts  │  │  │  │ - xcrun.ts      │ │
        │  └──────────────────┘  │  │  └─────────────────┘ │
        └────────────────────────┘  └──────────────────────┘
                    │                          │
                    │                          │
                    ▼                          ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │  Android Devices     │  │   iOS Devices        │
        │  - Emulators         │  │   - Simulators       │
        │  - Physical Devices  │  │   - Physical Devices │
        └──────────────────────┘  └──────────────────────┘
```

## Autolinking System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Process Starts                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Expo Modules Autolinking Scans Project            │
│                                                             │
│  1. Scans node_modules for expo-module.config.json         │
│  2. Parses module configurations                           │
│  3. Collects platform-specific information                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┬──────────────┐
                ▼                      ▼              ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
    │   Android        │  │      iOS         │  │    Web      │
    │   Autolinking    │  │   Autolinking    │  │ Autolinking │
    └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘
             │                     │                    │
             ▼                     ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
    │ Generate:        │  │ Generate:        │  │ Generate:   │
    │ - Kotlin code    │  │ - Swift code     │  │ - JS code   │
    │ - Gradle config  │  │ - Podfile config │  │ - Webpack   │
    └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘
             │                     │                    │
             ▼                     ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
    │ Include in       │  │ Include in       │  │ Include in  │
    │ Android Build    │  │ iOS Build        │  │ Web Bundle  │
    └──────────────────┘  └──────────────────┘  └─────────────┘
```

## Type Conversion System

```
┌─────────────────────────────────────────────────────────────┐
│                 JavaScript Call to Native                   │
│              nativeModule.processData(data)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Expo Modules Core - Type Conversion            │
│                                                             │
│  JavaScript Type  →  Native Type Converter  →  Native Type │
│                                                             │
│  number          →  NumberConverter         →  Int/Float   │
│  string          →  StringConverter         →  String      │
│  object          →  RecordConverter         →  Map/Dict    │
│  array           →  ArrayConverter          →  List/Array  │
│  Date            →  DateConverter           →  Date/NSDate │
│  Color string    →  ColorConverter          →  Color       │
│  enum            →  EnumConverter           →  Enum        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Native Module Function Execution             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Return Value Type Conversion                   │
│                                                             │
│  Native Type  →  Type Converter  →  JavaScript Type        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Promise Resolved in JS                    │
└─────────────────────────────────────────────────────────────┘
```

## Event System Flow

```
┌─────────────────────────────────────────────────────────────┐
│               Native Event Occurs (e.g., Bot Reply)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Native Module Emits Event                           │
│                                                             │
│  Android:  sendEvent("onReply", mapOf("message" to reply)) │
│  iOS:      sendEvent("onReply", ["message": reply])        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Expo Modules Core - Event Bridge                 │
│                                                             │
│  - Serializes event data                                   │
│  - Routes to JavaScript event emitter                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             JavaScript EventEmitter                         │
│                                                             │
│  const subscription = botModule.addListener('onReply',     │
│    (event) => { console.log(event.message); }              │
│  );                                                         │
└─────────────────────────────────────────────────────────────┘
```

## Shared Object Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│            JavaScript Creates Shared Object                 │
│          const bot = new LyxBot(config);                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Native Shared Object Instantiated                   │
│                                                             │
│  Android: SharedObject instance with SharedObjectId         │
│  iOS: SharedObject instance with objectId                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        JavaScript Holds Reference to Native Object          │
│                                                             │
│  - Calls methods: bot.sendMessage("Hello")                 │
│  - Accesses properties: bot.isActive                       │
│  - Receives events: bot.addListener('onReply')             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         JavaScript Object Garbage Collected                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Native Shared Object Deallocated                    │
│                                                             │
│  - Cleanup resources                                       │
│  - Release memory                                          │
│  - Close connections                                       │
└─────────────────────────────────────────────────────────────┘
```

## Complete AI Platform Architecture Example

```
┌──────────────────────────────────────────────────────────────────┐
│                       AI Platform Application                    │
│                       (React Native + Expo)                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┐
         │               │               │              │
         ▼               ▼               ▼              ▼
┌────────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────┐
│  LyxBot Module │ │ ML Module  │ │ Voice Module │ │ NLP Mod  │
│                │ │            │ │              │ │          │
│ - Chat        │ │ - Vision   │ │ - Speech     │ │ - Text   │
│ - Learning    │ │ - Detection│ │ - Synthesis  │ │ - Analysis│
│ - Memory      │ │ - Classify │ │ - Recognition│ │ - Translate│
└───────┬────────┘ └──────┬─────┘ └───────┬──────┘ └────┬─────┘
        │                 │                │             │
        └─────────────────┴────────────────┴─────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │      Expo Modules Core                 │
        │  - Event System                        │
        │  - Type Conversion                     │
        │  - Shared Objects                      │
        └────────────────┬───────────────────────┘
                         │
         ┌───────────────┼───────────────┬
         ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│   Android       │ │    iOS      │ │     Web      │
│                 │ │             │ │              │
│ - ML Kit        │ │ - Core ML   │ │ - TensorFlow │
│ - TensorFlow    │ │ - Vision    │ │   .js        │
│   Lite          │ │ - Speech    │ │ - Web APIs   │
│ - Kotlin Coroutines│ │ - Swift   │ │ - WebAssembly│
└─────────────────┘ └─────────────┘ └──────────────┘
```

## File Organization for AI/Bot Module

```
my-ai-module/
│
├── expo-module.config.json        # Module configuration
│
├── src/                           # JavaScript/TypeScript API
│   ├── index.ts                   # Main exports
│   ├── LyxBot.ts                  # Bot class (SharedObject)
│   ├── LyxBot.web.ts              # Web-specific implementation
│   ├── types.ts                   # TypeScript definitions
│   └── utils.ts                   # Helper functions
│
├── android/                       # Android implementation
│   ├── build.gradle               # Gradle build config
│   └── src/main/java/
│       └── expo/modules/lyxbot/
│           ├── LyxBotModule.kt    # Module definition
│           ├── LyxBot.kt          # Bot implementation
│           ├── MLProcessor.kt     # ML processing
│           └── types/             # Type converters
│
├── ios/                           # iOS implementation
│   ├── LyxBotModule.podspec       # CocoaPods spec
│   ├── LyxBotModule.swift         # Module definition
│   ├── LyxBot.swift               # Bot implementation
│   ├── MLProcessor.swift          # ML processing
│   └── TypeConverters/            # Type converters
│
├── plugin/                        # Config plugin (if needed)
│   └── src/
│       └── index.ts               # Expo config plugin
│
└── __tests__/                     # Tests
    ├── LyxBot.test.ts
    └── integration/
```

## Data Flow for AI Processing

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│   React Native Component                │
│   bot.processMessage(input)             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   JavaScript API Layer                  │
│   LyxBot.processMessage()               │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Expo Modules Core Bridge              │
│   - Type conversion (string → String)   │
│   - Route to native                     │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│   Android    │ │     iOS      │
├──────────────┤ ├──────────────┤
│ ML Kit NLP   │ │ Core ML NLP  │
│ Processing   │ │ Processing   │
└──────┬───────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
┌─────────────────────────────────────────┐
│   Native Processing Complete             │
│   Return result via Promise             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   JavaScript receives result            │
│   Update UI with response               │
└─────────────────────────────────────────┘
```

## Legend

```
┌─────┐
│ Box │  = Component or Layer
└─────┘

  │
  ▼      = Data/Control Flow

┌─────┬─────┐
│  A  │  B  │  = Multiple Options/Paths
└─────┴─────┘
```

---

## Key Takeaways for Your Project

1. **Modular Architecture**: Each feature (bot, ML, voice) can be a separate module
2. **Platform-Specific**: Implement native code for each platform for best performance
3. **Autolinking**: Automatic discovery and integration of modules
4. **Type Safety**: Type converters handle JS ↔ Native communication
5. **Event-Driven**: Use events for real-time bot responses
6. **Shared Objects**: Maintain stateful bot instances across platforms

---

This diagram shows how all the pieces fit together in the Expo ecosystem for building modular, cross-platform applications with AI capabilities.
