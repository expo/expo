# Tikanga Charter

## Purpose

This charter defines how Māori cultural protocols (tikanga) are embedded and protected within MauriMesh.

## Principles

### 1. **Mana Tangata** (Human Authority)
Users have absolute authority over their data, identity, and connections.

### 2. **Mana Kōrero** (Communication Authority)
Messages are sacred between sender and receiver. No third-party access.

### 3. **Mana Whenua** (Place Authority)
Geographic data respects local sovereignty and user control.

### 4. **Mana Whakapapa** (Relationship Authority)
Trust relationships are defined by users, not systems.

### 5. **Mana Tikanga** (Protocol Authority)
The system follows declared protocols. No hidden behavior.

## Cultural Boundary

| Layer | Māori Terms | Translation |
|-------|-------------|-------------|
| **Core (Rust)** | ✅ Allowed | Internal logic |
| **FFI Bridge** | ❌ Forbidden | Neutral English |
| **UI (TypeScript)** | ❌ Forbidden | User-friendly |
| **Network** | ❌ Forbidden | Encrypted metadata |

## Enforcement

1. **Code-Level**: Audit scripts block violations
2. **Build-Time**: CI/CD fails on boundary breach
3. **Runtime**: Ethics engine monitors decisions
4. **Community**: Governance board oversight

## Governance

- **Cultural Advisors**: Māori elders consulted
- **Community Input**: Regular hui (meetings)
- **Transparency**: Public audit reports
- **Accountability**: Violation response protocol

## Commitment

MauriMesh commits to:
- Protecting Māori intellectual property
- Ensuring cultural concepts are not appropriated
- Maintaining sovereignty by architecture
- Consulting with Māori communities
- Sharing benefits with Māori communities

---

**Tikanga Charter Version: 5.2.0**  
**Ratified: 2024-01-01**  
**Review: Annual**
