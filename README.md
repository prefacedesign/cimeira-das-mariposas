# Cimeira das Mariposas  
*project codename (Moth Summit)*

A  **Online Scientific Olympiad** web platform—designed to complement and eventually replace ONHB 2.0. This **monorepo** brings together all of:

- **Documentation & ADRs** (`docs/`)  
- **Shared libraries** (`packages/common/`)  
- **Frontend** (Nuxt 3 in `apps/nuxt-app/`)  
- **Backend & workers** (NestJS + CQRS in `apps/backend/`)  
- **Infrastructure & tooling** (Devenv.sh, CI config, etc.)

---

## Why

Our existing platform has served us well—supporting high exam-submission throughput, solid end user ux, and a secure although cumbersome admin dashboard—but:

- **Onboarding friction**: new devs struggle to ramp up.  
- **Manual processes**: many operational tasks still require hand-work.  
- **Limited analytics**: reporting and automation need modern tooling.
- **Bad UX on the admin side**: management tools must be more user-friendly and more resilient.

**Goal:** Leverage 17 years of lessons to build a more maintainable, automated, and extensible system—*incrementally*.

---

## How

We’ll follow a **two-phase rollout**:

1. **Coexistence (Phase 1)**  
   - Run new (v3) services alongside legacy (v2), sharing data via database.  
   - Implement new features on the modern stack only—no dual-writes.

2. **Migration & Cut-Over (Phase 2)**  
   - Gradually move each feature’s write-path to new tech stack; deprecate the old service.  
   - Once legacy components are retired, remove compatibilty layers and refactor freely.

---

## Core Principles

1. **Developer Experience (DX)**  
2. **Reproducible Dev & Prod Environments** 
3. **Open Source from Day 1** (License and development process)  
4. **Documented Tech Choices**
5. **Modular Architecture & Clear Boundaries**
6. **Groundwork laid off to empower future UX redesigns**

---

## Getting Started

```# todo

