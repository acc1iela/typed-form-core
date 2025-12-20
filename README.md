# typed-form-core

typed-form-core is a minimal, type-safe form state manager
built to explore how far TypeScript can enforce correctness
at compile time in form handling.

## Scope

✔ Flat form structure (no nested fields)
✔ Synchronous validation
✔ Type-safe field registration
✔ Type-safe validators

✘ Nested path (e.g. user.address.city)
✘ Field arrays
✘ Async validation
✘ UI components
