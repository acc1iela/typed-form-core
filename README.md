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

## Type Design

### Validators<T>

Each field can define a validator function.
Teh validator receives the field value and all form values.

```ts
type Validators<T> = {
  [K in keyof T]?: (value: T[K], values: T) => string | null;
};
```

## Why not React Hook Form?

This project intentionally avoids abstracting form behavior to explore how much correctness can be enforced purely by TypeScript types.
The goal is not feature completeness, but clarity of type-driven design.
