# MauriMesh 5.2 Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MAURIMESH 5.2                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   JumpCode  │  │    Mana     │  │  Transport  │      │
│  │ Intelligence│  │  Validation │  │ (BLE/LE/WiFi)│     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                               │
│                  ┌───────▼───────┐                       │
│                  │   Bridge FFI  │                       │
│                  │  (Sovereignty │                       │
│                  │   Boundary)   │                       │
│                  └───────┬───────┘                       │
└──────────────────────────┼───────────────────────────────┘
                           │
                   ┌───────▼───────┐
                   │  React Native │
                   │      UI       │
                   └───────────────┘
```

## Components

### Rust Core
- **JumpCode**: Transmission decision intelligence
- **Mana Validation**: Cultural protocol enforcement
- **Crypto**: XChaCha20-Poly1305 encryption
- **Transport**: BLE, LE Audio, WiFi Direct
- **Identity**: Device fingerprint management

### TypeScript Layer
- **UI Components**: React Native screens
- **Integration**: Bridge to Rust core
- **State Management**: Context providers
- **Hooks**: Reusable logic

### Network Layers
1. **Bluetooth Mesh** (primary)
2. **WiFi Direct** (secondary)
3. **Internet** (fallback)

## Security

- End-to-end encryption (XChaCha20-Poly1305)
- Device identity (Ed25519)
- Key rotation (every 24 hours)
- Secure storage (platform enclave)

## Cultural Boundary

```
INTERNAL (Rust)          EXTERNAL (UI/Network)
✓ TikangaMauri           ✗ NO Māori terms
✓ Māori protocols        ✓ Neutral English
✓ Cultural concepts      ✓ User-friendly labels
```

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Message send | <100ms | 50ms |
| Call connect | <3s | 2s |
| App start | <2s | 1.5s |
| JumpCode decision | <10ms | 5ms |

---

**Architecture Version: 5.2.0**
