# ADR 0000: Initial Architecture & Tech Stack

**Date:** 2025-07-11  
**Status:** Accepted

---

## Context
We are creating a new web platform for Online Scientific Olympiads. 

It will replace the current platform (ONHB-2) that we use now to run ONHB (Olimpíada Nacional em História do Brasil) that is on its 17th edition. 

This rewrite aims to:

- **Improve maintainability** and **onboarding** for new developers  
- **Automate operational processes** to boost management productivity and eliminate last-minute critical manual work  
- **Enhance data extraction & reporting** to automate one-off data-recovery tasks  
- **Streamline the admin experience** for both developers and pedagogical staff 
- **Empower the support team** with self-service data tools, reducing reliance on developers  
- **Cultivate a fresh development culture** by breaking legacy habits and starting on a clean slate  
- **Lay the groundwork** for future UX redesigns and large-scale refactors

The new platform must maintain:

- High submission throughput  
- Robust admin security  
- A good user experience  

It must also coexist with the legacy system **without dual-writes** until the full cutover is complete.


---

## Decisions

### -1. English for git commit messages, code commentary and documentation 
**Decision:** All source-level text (commit messages, code comments, and documentation) will be written in English. Portuguese translations of documentation will be generated and maintained via LLM assistance.

**Rationale:** Team already used to it, and this helps dev members to practice and be ready to be part of multi-national teams. As this project is open source and we aim for eventually to open up for contributions for the community, we don't get locked out of this option by the choice of language.


### 0. TypeScript as main programming language
**Decision:** Use TypeScript across both frontend and backend services.
**Alternatives Considered:**
  - **TypeScript (all code)**
  - **JavaScript (all code)**
  - **JS/TS + PHP**  
  - **JS/TS + Go**
**Rationale:**
  - **Type safety & DX:** TypeScript surfaces errors in-editor and unlocks richer IDE tooling.
  - **Unified stack:** one language across frontend/backend eases code sharing and cross-team collaboration.
  - **Departure from PHP:** despite maturity, PHP feels cumbersome; the team prefers a cleaner JS/TS ecosystem.


### 1. Monorepo  
**Decision:** Use a single monorepo managed with **Yarn Workspaces** for code, docs, shared libraries and infra. 
**Alternatives Considered:**  
  - **Multi-repo** (one repo per service, integration using yarn or node packages)  
  - **Monorepo**  
**Rationale:**  
  - **Workspace management:** Yarn’s workspaces CLI and hoisting are more battle-tested than npm’s.
  - **Code reuse:** Simplifies sharing of @common modules, types, and ADR templates.
  - **Unified CI:** One pipeline to lint, test, and build all packages together.
  - **Cross-cutting refactors:** Easier to rename, move or version code that spans multiple services.
  - **Repo size trade-off:** Our small team/project means the repo will remain manageable; if it grows too large, we can split it later.
  - **Single dev shell:** One devenv.sh/Nix shell covers every package, so you know exactly which tools and services to run locally.

---

### 2. Dev Environment (`devenv.nix`)  
**Decision:** Provision a reproducible development environment via Nix (`devenv.nix`), exposing two commands:
  - `devenv up` – bootstraps all required services (databases, Kafka, etc.)
  - `devenv shell` – drops you into a shell with all the tools (Node, Git, Typst, Trino CLI, etc.)
**Rationale:**  
  - **Reproducibility:** Pins exact versions of Node, Git, Typst, Trino CLI, etc., across every dev machine and CI.
  - **Environment Consistency:** Eliminates “works on my machine” drift by removing OS-level discrepancies.
  - **Streamlined Onboarding:** New contributors can spin up the full stack with one command.
  - **Team Expertise:** Our lead’s familiarity with Nix outweighs the learning curve, and the team will ramp up through shared shell definitions.

---

### 3. Documentation (VuePress 2)  
**Decision:**  Adopt VuePress 2 as our Markdown site generator for its native Vue integration, built-in i18n, and easy theming. 
**Alternatives Considered:**  
  - **Docusaurus** (built-in versioning, React/MDX)  
  - **MkDocs Material** (Python, lightweight)  
  - **VuePress 2**  
**Rationale:**  
  - **Vue & MDX-style authoring:** leverages our team’s Vue expertise and enables embedded components via MDX-like syntax.
  - **Multilingual out of the box:** first-class i18n config and language selector with zero plugins.
  - **Rich plugin ecosystem:** theming, search, diagram support, and more via official/community plugins.
  - **Minimal added complexity:** integrates smoothly into our Node/Vue toolchain without dragging in React or Python runtimes.

---

### 4. Frontend Framework (Nuxt 3 + Tailwind CSS)  
**Decision:** Build the UI in **Nuxt 3** (`apps/nuxt-app/`), using **Tailwind CSS** for styling.
**Rationale:**  
  - **Vue proficiency:** Leverages our team’s experience with Vue 3 and Nuxt conventions.
  - **Server-side rendering:** Built-in SSR and composables avoid pulling in React or another heavy framework.
  - **Designer-friendly:** Proximity to HTML + CSS lets designers work directly in the codebase.
  - **Utility-first styling:** Tailwind’s utility classes streamline styling inside Vue components.

---

### 5. Backend Architecture  
*(Event-Driven, Event Sourcing & CQRS via AsyncAPI spec)*

**Decision:** Adopt an event-driven architecture (EDA) with event sourcing and CQRS, publishing all commands & events according to our AsyncAPI contract.  

**Rationale:**  
  - **Legacy limitations:** Our current REST API already needed RPC-style “actions,” ad-hoc cron jobs, and console scripts for long-running tasks.
  - **Loose coupling:** EDA lets us decouple services into small, polyglot workers (e.g. a high-performance Go saga step).
  - **Saga orchestration:** Native event flows simplify multi-step transactions, retries, compensations and load management (for example: accruing batches of same nature changes)
  - **Event replay:** Having an append-only event log boosts testability, time-travel debugging, and auditability.
  - **AsyncAPI contracts:** Defining all events in an AsyncAPI spec gives us type-safe, versioned message schemas across producers & consumers.

**Consequences:**
*Drawbacks we have to live with:*
  - **Initial friction:** Adds boilerplate to simple CRUD flows and requires team ramp-up on EDA patterns.
  - **Learning curve:** Our team is new to fully event-driven systems, so first modules will incur some rework.

---

### 6. Backend & Workers  
*(NestJS + @nestjs/cqrs)*

**Decision:**  
Use **NestJS** with the **@nestjs/cqrs** module in `apps/backend/` to implement all HTTP APIs and Kafka-based worker processes.

**Alternatives Considered:**  
- **Moleculer** (service-broker framework)  
- **DIY**: Express/Koa + kafkajs + custom orchestration  
- **NestJS + CQRS** *(chosen)*  

**Rationale:**  
- **Modular architecture:** Nest’s module system and built-in dependency injection enforce clear boundaries between services.  
- **CQRS & Sagas support:** @nestjs/cqrs provides out-of-the-box patterns for commands, events, and long-running workflows.  
- **TypeScript first:** Full TS support with decorators and metadata enhances developer productivity and type safety.  
- **Rich ecosystem:** A mature collection of Nest plugins is available for job scheduling (`@nestjs/schedule`), health checks (`@nestjs/terminus`), metrics, and more.  

---

### 7. Shared Libraries & Packages

**Decision:**  
Extract all cross-cutting domain logic (e.g. question types, validation, serializers) into local packages under `packages/`, consumed via Yarn Workspaces by both the Nuxt frontend and the NestJS backend.

**Rationale:**  
- **Code reuse:** Centralizes feature implementations so both UI and API share a single source of truth.  
- **Consistency:** Eliminates duplication and drift when multiple services must interpret the same domain concepts.  
- **Modularity:** Encapsulates related functionality in discrete packages, simplifying testing, versioning, and replacement.  
- **Scaffolding:** Leverages workspace templates to rapidly bootstrap new feature packages with minimal boilerplate.

**Conceptual note:**  
Rather than forcing every feature into a single directory tree (“putting things in boxes”), this approach treats shared logic as referenced pointers—packages that can be grouped and composed along multiple dimensions (by domain, by layer, or by team) without duplication. It’s a way to subdivide and recombine project concerns fluidly, avoiding the rigidity of a one-size-fits-all folder hierarchy.

**Consequences:**  
- **Tighter coupling:** Changes to a shared package ripple across all consumers, requiring coordinated updates.  
- **Version management:** Necessitates a clear strategy for publishing and upgrading internal packages.  
- **Tooling complexity:** Local package resolution and watch/ rebuild workflows demand extra configuration in the dev shell and CI.


### 8. Database & Asset Storage  
*(PostgreSQL + Kafka + S3-compatible storage)*

**Decision:**  
Use **PostgreSQL** as our primary relational database, **Kafka** for event streaming, direct **MySQL** reads (via `mysql_fdw`) during migration, and an **S3-compatible** object store for assets.

**Rationale:**  
- **Event streaming:** Kafka is a mature, open-source standard for high-throughput, durable messaging and CDC pipelines.  
- **Advanced SQL:** PostgreSQL offers transactions, complex joins, JSONB, and materialized views—critical for our analytics and growing data models.  
- **Legacy integration:** `mysql_fdw` lets us query existing MySQL tables from Postgres without dual-writes, smoothing the transition.  
- **Scalable assets:** An S3-compatible store (e.g. AWS S3 or MinIO) provides durable, cost-effective hosting for images, PDFs, and other large files.  

### 9. Coexistence Strategy

**Decision:**  
Adopt a two-phase migration approach:
- **Phase 1 – Feature implementation:** Build all new functionality on the modern stack, reading legacy data via Postgres + `mysql_fdw`, while continuing to write to the existing system (no dual-writes).
- **Phase 2 – Write-path migration:** For each feature, migrate its write path into the new stack and immediately deprecate the corresponding legacy write logic. Reads may temporarily hit both systems during the transition.

**Rationale:**  
- **Incremental ramp-up:** Let the team adapt to the new stack by delivering features rather than refactoring everything at once.  
- **Minimized risk:** Leaving legacy write paths untouched preserves battle-tested core functionality.  
- **Progressive refactoring:** Feature-by-feature migration narrows scope for testing and rollback.  
- **Read continuity:** Temporary read duplication (via `mysql_fdw` or similar) keeps data available without downtime.  
- **Natural cut-over points:** Completing each feature’s migration provides a clear, testable cut-over moment.


### 10. Analytics & Reporting Layer  
*(Trino)*

**Decision:**  
Use **Trino** as our federated analytics engine, enabling ANSI-SQL queries across MySQL, PostgreSQL, Kafka, S3, and other data sources without ETL.

**Rationale:**  
- **Connector ecosystem:** Built-in connectors for MySQL, Postgres, Kafka, S3, Hive, and more let us query all our data in-place.  
- **ANSI SQL compliance:** A familiar SQL dialect means minimal ramp-up and easy reuse of existing queries.  
- **Lightweight infrastructure:** Runs queries on existing stores—no separate OLAP cluster or data duplication required.  
- **Materialized views & optimizations:** Supports fast, interactive reporting via native materialized views and cost-based optimizations.  
- **Horizontal scalability:** Distributed execution lets us scale out query capacity as analytic workloads grow.


---

### 11. License  
*(Mozilla Public License 2.0)*

**Decision:**  
Release the project under the **Mozilla Public License 2.0 (MPL-2.0)**.

**Rationale:**  
- **File-level copyleft:** Ensures any modifications to MPL-licensed files remain open under the same terms.  
- **Balanced restrictions:** Less viral than GPL/AGPL but still requires contributions back for derived work.  
- **License compatibility:** OSI-approved, allowing mix-and-match with other licenses in a larger codebase.

**Consequences:**  
- All source files should include the proper SPDX header (`SPDX-License-Identifier: MPL-2.0`).  
- Third-party code can be combined in the repo, but MPL-licensed files themselves must remain open and unchanged in license.  

---

## Consequences

### Benefits
- **Clear migration path:** Phase-by-phase rollout avoids downtime and gives clear cut-over points.  
- **Modular codebase:** EDA/CQRS and the monorepo structure improve separation of concerns.  
- **Eliminates ad-hoc workarounds:** Reduces brittle, manual scripts by fitting all logic into the event flow.  
- **Reproducible environments:** Nix-driven shells ensure dev & CI match production. 
- **Rapid onboarding:** Instant dev shell and single-step deployment lower the barrier to entry.  
- **Scalable platform:** Ready to serve larger audiences with federated analytics and decoupled workers.  
- **Single source of truth for docs:** ADRs and Markdown live in one place, ensuring consistency.

---

### Drawbacks
- **Steep learning curve:** Nix, Trino, NestJS/CQRS and EDA/Kafka demand significant up-front investment.  
- **Operational overhead:** Running Trino clusters and managing Nix builds in CI adds complexity.  
- **Reduced quick fixes:** The uniform EDA/CQRS architecture adds boilerplate for simple, one-off changes.  
- **Discipline required:** A single docs source works only if the team follows strict commit and ADR practices.  


---

## Next Steps

1. Commit `devenv.nix` and `devenv.sh`.  
2. Scaffold directories: `docs/`, `packages/common/`, `apps/nuxt-app/`, `apps/backend/`.  
3. Add this file as `docs/architecture/adr/0000-initial-architecture.md`.  
4. Create ADR template in `docs/architecture/templates/_adr-template.md`.  
5. Deliver a “thin slice” feature: new dashboard with single functionality, generate common reports and data exports.

---

## Future Considerations

These items are on our radar but not yet decided. We’ll create dedicated ADRs as we evaluate each:

- **Supabase (self-hosted)**  
  How to integrate as a backend service (never exposed directly to the frontend) for auth and realtime subscriptions.

- **Kysely vs. ORM**  
  Evaluate using [Kysely](https://kysely.org/) for type-safe query building instead of a full-blown ORM.

- **Typst for docs/certificates**  
  Replace the current PHP + Bash + LaTeX pipeline with [Typst](https://typst.org/) for authoring and templating certificates and other documents.

- **Component & chart libraries**  
  Select a UI component library (e.g. Headless UI, Vuetify) but wrap it in our own Vue components for future swapping. Evaluate D3-based or Vega-Lite chart components for analytics dashboards.

- **AI-powered dev CLI**  
  Explore a CLI tool (integrated as a dev-shell command or CI step) to enforce architectural patterns, lint commit separation, and auto-generate translated docs for manual review.
