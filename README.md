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

このプロジェクトは、TypeScript の型システムでどこまで不正な状態をコンパイル時に防げるかを探求します。

### キーと値の強い結合

最も重要な不変条件：

> **フィールドのキーが決まれば、値の型も必ず決まる**

この不変条件を実現するために、すべての API で以下のパターンを徹底しています：

```typescript
// K でキーを制約し、TValues[K] で値の型を取得
<K extends keyof TValues>(name: K) => TValues[K]
```

これにより以下が保証されます：

- `register('username')` の返り値は `RegisterReturn<TValues, 'username'>` 型
- `setValues('username', value)` は `TValues['username']` 型の値のみ受け入れ
- `validators.username` は `(value: TValues['username'], values: TValues) => ...` 型

### 学習目的

このプロジェクトが探求する問い：

- **型でどこまでランタイムエラーを防げるか？**
  - バリデーションロジックを型で表現できるか？
  - 不正な状態を「表現できない」設計は可能か？

- **バリデーションは型とランタイムのどちらで行うべきか？**
  - 型による静的チェックの限界はどこか？
  - ランタイムバリデーションが必要な場面は？

- **型の複雑さと使いやすさのトレードオフは？**
  - 型安全性を追求すると API は複雑になるか？
  - シンプルさを保ちながら型安全にできるか？

### 意図的なスコープ制限

以下の機能は意図的に対象外としています：

- **ネストしたフィールド**（例：`user.address.city`）
  - 型推論が複雑化し、設計意図が不明瞭になるため

- **非同期バリデーション**
  - 型による保証が困難になり、ランタイムの状態管理が複雑化するため

- **フィールド配列**
  - 動的な型推論が必要になり、型の分かりやすさが損なわれるため

**「型の分かりやすさ」を優先**するため、これらの機能は追加しません。
機能の網羅性ではなく、型設計の明確さを重視しています。

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
