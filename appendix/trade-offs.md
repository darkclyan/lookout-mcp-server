# Trade-offs

## Structured query vs raw SQL

Structured queries were chosen for safety, predictable validation, and stable tooling behavior.

## Page-number pagination vs cursor pagination

Page-based pagination was chosen for simpler contracts and deterministic test behavior.

## Offline SQLite vs live connectors

Offline SQLite was chosen to keep execution reproducible and setup simple.

## Focused tool set vs generic endpoints

Narrow tool responsibilities were chosen to reduce ambiguity for agents.

## Deterministic failures vs random failures

Deterministic failures were chosen to keep behavior testable and easier to debug.

## Path-based artifacts vs inline bytes

Filesystem artifacts were chosen to keep payloads small and reusable.

## Single-datasource queries vs cross-datasource joins

Single-datasource querying was chosen for validation simplicity and clearer contracts.
