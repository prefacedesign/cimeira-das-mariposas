# ADR 0000: Initial Architecture & Tech Stack

**Date:** 2025-07-11  
**Status:** Accepted

---

## Context
We are creating a new web platform for Online Scientific Olympiads. It will replace the current platform (ONHB-2) that we use now to run ONHB (Olimpíada Nacional em História do Brasil) that is on its 17th edition, to:

- improve **maintainability** and **onboarding** for new developers  
- improve **automation** of operational processes to increase productivity of the management team, and remove as much as possible from the workflow hand-work that is done in time critical moments
- improve **data extraction** and reporting capabilities, to automate data recovery operations that currently are done on a one by one basis
- improve **admin user experience** for the management team (developers and pedagogical team). Facilitating also onboarding of people on the pedagogical team.
- improve **data availability for support team** provide tools for support teams to be able to acquire relevant information more easily, offloading the technical team.
- provide a **fresh start for development culture**: break old habits used on the last platform, by starting a new project on a different footing.
- provide a **foundation for a design rework and future refactors**.

The new platform must continue to handle high submission throughput, offer strong admin security, and enable a smooth user experience, all while coexisting without dual-writes until we can fully cut over.

---

## Decisions

### -1. English for git commit messages, code commentary and documentation 
**Decision:** Use English as the project development language, but leverage modern LLMs to maintain a portuguese translation of the documentation
**Rationale:** Team already used to it, and this helps dev members to practice and be ready to be part of multi-national teams. As this project is open source and we aim for eventually to open up for contributions for the community, we don't get locked out of this option by the choice of language.


### 0. Languages (TypeScript)
**Decision:** Use mainly TypeScript for front end and back end.
**Alternatives Considered:**
  - **TypeScript**
  - **Javascript**
  - **Hybrid TypeScript + PHP**  
  - **Hybrid JavaScript + PHP** Most familiar to the team.
  - **Hybrid TS or JS + Go** Most performant option
**Rationale:**
  - While keeping JavaScript for frontend and PHP for frontend would be more familiar to current team, Typescript's provides a better development experience and helps to identify more errors while still on the editor, IDEs can provide better contextual inline help. PHP while more mature nowadays, is still a very cumbersome language and subjectivily despite long time experience it still feels 'ugly', so the team was kind of eager to move on from it. And moving on to use the same language for frontend and backend will help to share code between them.


### 1. Monorepo  
**Decision:** Use a single monorepo (with Yarn Workspaces) for code, docs, and infra.  
**Alternatives Considered:**  
  - **Multi-repo** (one repo per service, integration using yarn or node packages)  
  - **Monorepo**  
**Rationale:**  
  - Yarn manages better multiple workspaces than plain npm.
  - Simplifies sharing of `@common` modules and ADRs.  
  - One CI pipeline covering all packages.  
  - Easier cross-cutting refactors and version coordination.
  - Team and project is small enough that project won't grow large enough for the repository to become too big. And if it does arrive to that point, moving away from monorepo can be done.
  - Single development environment helps to keep track of what you must keep running for the whole system to work.

---

### 2. Dev Environment (`devenv.nix`)  
**Decision:** Define a Nix-based dev environment (`devenv.nix`), with `devenv up` for spinning up a dev environment and `devenv shell` for a development shell.
**Rationale:**  
  - Guarantees identical tool versions (Node, Git, Typst, Trino CLI) across all machines and CI.  
  - Eliminates “works on my machine” drift.  
  - Project lead has enought familiarity with Nix outweighs Docker-only alternatives, other team members have less of familiarity but they will have to trust their project lead on this one :D

---

### 3. Documentation (VuePress 2)  
**Decision:** Use **VuePress 2** for multilingual Markdown docs and ADRs under `docs/`.  
**Alternatives Considered:**  
  - **Docusaurus** (built-in versioning, React/MDX)  
  - **MkDocs Material** (Python, lightweight)  
  - **VuePress 2**  
**Rationale:**  
  - Leverages our Vue expertise and MDX-like flexibility.  
  - First-class i18n support out of the box.  
  - Easy theming and plugin ecosystem.
  - Avoids introducing too much elements to the tech stack

---

### 4. Frontend Framework (Nuxt 3 + Tailwind CSS)  
**Decision:** Build the UI in **Nuxt 3** (`apps/nuxt-app/`) with Tailwind CSS as a styling framework.  
**Rationale:**  
  - Our team’s deep experience with Vue 3 and Nuxt conventions.  
  - Built-in SSR and composables; avoids introducing React or a less-opinionated framework.  
  - proximity to HTML+CSS makes it easier for designers to work directlly on the code
  - Tailwind’s utility classes simplify styling within Vue components.

---

### 5. Backend Architecture (Event Driven Architecture, following Async API standard)  
**Decision:** Follow an Event Driven Architecture, with Event Sourcing (generated events are the source of truth, events trigger modification of read structures), CQRS (write paths and read paths have different models).
**Rationale:**  
  - Current platform has a REST Crud API, that already had to deviate from a pure resource oriented design, with the addition of 'actions' that amount for actual RPCs (remote procedure calls), we already have data spread with multiple sources, with a dataflow between them, for long running tasks we have makeshift console commmands that fill the gap for stuff that won't fit well in a REST API call. Some stuff already work in a crude event driven way (notifications for instance) with some fragile cron jobs.  
  - switching to a EDA will enable some systems that are currently implemented in a cumbersome way to have a more straightforward implementation
  - once we have an EDA implemented coexistence of multiple systems becomes much more easy (you can for example, implement only one step of saga in Golang for instance for something that is used a lot, and have a disproportionate impact on the performance)
  - some cons:
    - for some stuff that are more simple, it adds some friction in initial implementation, a cost we must pay to make the architecture uniform accross all systems.
    - the team is still green to this way of working, it _will_ result in reworks and suboptimal implementations for the first modules made doing that
  - the ability to replay history of events is a huge boost to our ability to test system changes, and system performance

---

### 6. Backend & Workers (NestJS + CQRS)  
**Decision:** Use **NestJS** with **@nestjs/cqrs** in `apps/backend/` for HTTP APIs and Kafka workers.  
**Alternatives Considered:**  
  - **Moleculer** (service broker)  
  - **DIY** (Express/Koa + kafkajs + homegrown patterns)  
  - **NestJS + CQRS**  
**Rationale:**  
  - Structured modules, DI, and built-in support for Sagas and Events.  
  - Strong TypeScript support and testability.  
  - Ecosystem of Nest plugins for scheduling, health checks, and metrics.

### 7. Database and asset storage (Postgres + Kafka + S3 compatible asset storages)
**Decision:** Use PostgreSQL as main database, Kafka as data streaming solution, direct MySQL connections for legacy reads.
**Rationale:**  
  - Kafka is a mature solution that is open source and industry standard for this sort of application
  - Postgres is a full featured SQL RDBMS solution, that handles better complex reads and writes than MySQL, has materialized views,
  MySQL initial setup is easier, and the team is more used to it, but its advantages stop there, migration to Postgres
  - There is an option to read MySQL tables through mysql_fdw that can be used for the transition process


### 8. Coexistence Strategy 
**Decision:** Phase One: New features implemented in the new tech stack—but no dual-writes. Phase Two refactor step by step of core funcionality, writes never coexist, once the write path is implemented, old write path is deprecated. Read path can have some degree of temporary duplication.
**Rationale:**  
  - Focusing initially on missing functionality gives time to the team to adapt to the new way of doing things.
  - Avoids breaking battle tested core funcionality.
  - Leaves refactor of core func once the team is already comfortable with the new tech stack
  - Clear cut-over once each feature fully migrates.
  - Once phase two starts, some tools like Postgress + mysql_fdw can be used to help with intermmediary code

---

### 9. Analytics/reports Layer (Trino)  
**Decision:** Use **Trino** for federated analytics across MySQL, Postgres, Kafka, S3, etc.  
**Rationale:**  
  - Rich connector ecosystem; ANSI-SQL compatibility.  
  - Leverages existing object stores and databases without a separate analytics cluster.  
  - Supports materialized views, interactive queries, and easy scaling.

---

### 10. License (MPL 2.0)  
**Decision:** Release under the **Mozilla Public License 2.0**.  
**Rationale:**  
  - File-level copyleft ensures modifications to our code remain open.  
  - Less viral than GPL/AGPL, but still guarantees contributions back for derived work.

---

## Consequences

- **Clear cut transition strategy**
- **Improved modularity**
- **Reduced varied work-arounds** EDA allows for all the functions to fit neatly into the design. No more awkward improvised work-arounds that fall short and are really awful to maintain and involve some amount of hand-work to make it work.
- **Instant working development environment**
- **Clear single step deployment**
- **Readiness to attend a even larger public**
- **Reduced workload for devs and management**
- **Improved DX and UX** for the dev and management teams
- **Reduced agility in making small incremental fixes** doing it right has an overhead cost, but enables the project sustainability, that today is bearing on being unsustainable.
- **Steep learning curve** for Nix, Trino, NestJS/CQRS and EDA/Kafka/Async API
- **Operational overhead** in running a Trino coordinator/workers and managing Nix builds in CI.  
- **Single source of truth** for docs and ADRs, but requires disciplined commit practices.  
- **Incremental migration** prevents downtime, allows for the fact that with the current team size, one bulky once a time replacement is totally unachievable.

---

## Next Steps

1. Commit `devenv.nix` and `devenv.sh`.  
2. Scaffold directories: `docs/`, `packages/common/`, `apps/nuxt-app/`, `apps/backend/`.  
3. Add this file as `docs/architecture/adr/0000-initial-architecture.md`.  
4. Create ADR template in `docs/architecture/templates/_adr-template.md`.  
5. Deliver a “thin slice” feature: new dashboard with single funcionality, generate common reports and data exports.

---
