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

## Installation

```bash
npm install typed-form-core
```

## Usage

### Basic Example

```tsx
import { useForm } from 'typed-form-core';

type LoginForm = {
  username: string;
  password: string;
};

function LoginPage() {
  const form = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const usernameField = form.register('username');
  const passwordField = form.register('password');

  const handleSubmit = form.handleSubmit((values) => {
    console.log('Valid form:', values);
    // API call here
  });

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          name={usernameField.name}
          value={usernameField.value}
          onChange={(e) => usernameField.onChange(e.target.value)}
          onBlur={usernameField.onBlur}
        />
        {form.errors.username && <span>{form.errors.username}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name={passwordField.name}
          value={passwordField.value}
          onChange={(e) => passwordField.onChange(e.target.value)}
          onBlur={passwordField.onBlur}
        />
        {form.errors.password && <span>{form.errors.password}</span>}
      </div>

      <button type="submit" disabled={form.isSubmitting}>
        Login
      </button>
    </form>
  );
}
```

### With Validators

```tsx
import { useForm } from 'typed-form-core';
import type { Validators } from 'typed-form-core';

type RegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const validators: Validators<RegistrationForm> = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Invalid email format';
    return null;
  },
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  },
  confirmPassword: (value, values) => {
    if (value !== values.password) return 'Passwords must match';
    return null;
  },
};

function RegistrationPage() {
  const form = useForm<RegistrationForm>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators,
  });

  // ... rest of the component
}
```

## API Reference

### `useForm<TValues>(options)`

Creates a form instance with type-safe field management.

**Parameters:**
- `options.defaultValues: TValues` - Initial values for all form fields (required)
- `options.validators?: Validators<TValues>` - Optional validation functions for each field

**Returns:**

- `values: TValues` - Current form values
- `errors: Errors<TValues>` - Current validation errors (empty object if no errors)
- `touched: Touched<TValues>` - Fields that have been blurred (empty object initially)
- `isSubmitting: boolean` - Whether form is currently submitting (always `false` for sync validation)

**Methods:**

- `register<K extends keyof TValues>(name: K): RegisterReturn<TValues, K>` - Register a field and get its props
  - Returns: `{ name, value, onChange, onBlur }`
  - `onChange(value: TValues[K])` - Update field value
  - `onBlur()` - Mark field as touched and trigger validation

  **Example with explicit typing:**
  ```tsx
  import type { RegisterReturn } from 'typed-form-core';

  type LoginForm = { username: string; password: string };
  const form = useForm({ defaultValues: { username: '', password: '' } });

  // Explicitly type the field
  const usernameField: RegisterReturn<LoginForm, 'username'> = form.register('username');
  // usernameField.value is guaranteed to be string
  ```

- `setValues<K extends keyof TValues>(name: K, value: TValues[K])` - Manually update a field value

- `validateField<K extends keyof TValues>(name: K)` - Validate a single field
  - Returns: `boolean` - `true` if valid, `false` if invalid

- `validateAll()` - Validate all fields that have validators
  - Returns: `boolean` - `true` if all valid, `false` if any invalid

- `handleSubmit(onValid: (values: TValues) => void)` - Create submit handler
  - Returns a function that validates all fields and calls `onValid` only if valid
  - Automatically calls `preventDefault()` if passed a form event

- `reset(nextValues?: TValues)` - Reset form to default values (or specified values)
  - Clears all errors and touched state

### Type Safety Guarantee

All field operations are type-safe. TypeScript will prevent you from:

```tsx
const form = useForm({ defaultValues: { username: '', age: 0 } });

// ❌ TypeScript Error: "invalid" is not a valid key
form.register('invalid');

// ❌ TypeScript Error: string is not assignable to number
form.setValues('age', 'not a number');

// ✅ Correct
form.setValues('age', 25);
form.register('username').onChange('valid string');
```

## Type Design Philosophy

This project explores how far TypeScript's type system can prevent invalid states at compile time.

### Key-Value Binding

The most important invariant:

> **When a field key is determined, its value type is automatically determined.**

To achieve this invariant, we consistently use this pattern across all APIs:

```typescript
// Constrain the key with K, and get the value type with TValues[K]
<K extends keyof TValues>(name: K) => TValues[K]
```

This ensures:

- `register('username')` returns type `RegisterReturn<TValues, 'username'>`
- `setValues('username', value)` only accepts values of type `TValues['username']`
- `validators.username` has type `(value: TValues['username'], values: TValues) => ...`

### Learning Goals

This project explores these questions:

- **How far can types prevent runtime errors?**
  - Can validation logic be expressed in types?
  - Is it possible to design states that "cannot be represented" incorrectly?

- **Should validation be done in types or at runtime?**
  - Where are the limits of static type checking?
  - When is runtime validation necessary?

- **What are the trade-offs between type complexity and usability?**
  - Does pursuing type safety make the API complex?
  - Can we maintain both simplicity and type safety?

### Intentional Scope Limitations

The following features are intentionally excluded:

- **Nested fields** (e.g., `user.address.city`)
  - Type inference becomes complex and design intent unclear

- **Async validation**
  - Type guarantees become difficult, runtime state management becomes complex

- **Field arrays**
  - Dynamic type inference required, type clarity is compromised

We prioritize **"type clarity"** over feature completeness, focusing on design clarity rather than comprehensive features.

## Type Design

### Validators<T>

Each field can define a validator function.
The validator receives the field value and all form values.

```ts
type Validators<T> = {
  [K in keyof T]?: (value: T[K], values: T) => string | null;
};
```

## Why not React Hook Form?

This project intentionally avoids abstracting form behavior to explore how much correctness can be enforced purely by TypeScript types.
The goal is not feature completeness, but clarity of type-driven design.

## Errors<T>

Errors are keyed by form fields.

```ts
type Errors<T> = Partial<Record<keyof T, string>>;
```
