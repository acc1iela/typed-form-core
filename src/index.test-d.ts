import { expectType, expectError, expectAssignable } from 'tsd';
import { useForm } from './useForm';
import type { Validators, RegisterReturn, UseFormReturn } from './types';

// ===================================================================
// テスト1: useForm の基本的な型推論
// ===================================================================
type SimpleForm = { username: string; age: number };
const simpleForm = useForm({ defaultValues: { username: '', age: 0 } });

// values の型が正しく推論される
expectType<SimpleForm>(simpleForm.values);
expectType<string>(simpleForm.values.username);
expectType<number>(simpleForm.values.age);

// ===================================================================
// テスト2: register の型安全性
// ===================================================================

// 正しいキーは受け入れられる
const usernameField = simpleForm.register('username');
const ageField = simpleForm.register('age');

// 返り値の型が正しい
expectType<RegisterReturn<SimpleForm, 'username'>>(usernameField);
expectType<string>(usernameField.value);
expectType<number>(ageField.value);

// 存在しないキーはコンパイルエラー
expectError(simpleForm.register('invalid'));
expectError(simpleForm.register('email'));

// ===================================================================
// テスト3: setValues の型安全性
// ===================================================================

// 正しい型の値は受け入れられる
simpleForm.setValues('username', 'john');
simpleForm.setValues('age', 25);

// 型が合わない値はコンパイルエラー
expectError(simpleForm.setValues('username', 123));
expectError(simpleForm.setValues('age', 'not a number'));
expectError(simpleForm.setValues('invalid', 'value'));

// ===================================================================
// テスト4: validators の型安全性
// ===================================================================

const validators: Validators<SimpleForm> = {
  username: (value) => {
    // value は string 型と推論される
    expectType<string>(value);
    return value.length < 3 ? 'Too short' : null;
  },
  age: (value) => {
    // value は number 型と推論される
    expectType<number>(value);
    return value < 18 ? 'Must be 18+' : null;
  },
};

// 型が合わないバリデータはコンパイルエラー
expectError<Validators<SimpleForm>>({
  username: (value: number) => null, // string を期待
});

expectError<Validators<SimpleForm>>({
  age: (value: string) => null, // number を期待
});

// 存在しないキーはコンパイルエラー
expectError<Validators<SimpleForm>>({
  invalid: (value: any) => null,
});

// ===================================================================
// テスト5: 複雑な型の動作確認
// ===================================================================

type ComplexForm = {
  email: string;
  age: number | null;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
};

const complexForm = useForm<ComplexForm>({
  defaultValues: { email: '', age: null, role: 'user', active: false },
});

// nullable 型が正しく推論される
expectType<number | null>(complexForm.values.age);
expectType<number | null>(complexForm.register('age').value);

// union 型が正しく推論される
expectType<'admin' | 'user' | 'guest'>(complexForm.values.role);

// nullable のバリデータ
const complexValidators: Validators<ComplexForm> = {
  age: (value) => {
    // value は number | null と推論
    expectType<number | null>(value);
    if (value !== null && value < 0) return 'Must be positive';
    return null;
  },
  role: (value, values) => {
    // value は 'admin' | 'user' | 'guest'、values は ComplexForm 全体
    expectType<'admin' | 'user' | 'guest'>(value);
    expectType<ComplexForm>(values);
    return null;
  },
};

// ===================================================================
// テスト6: onChange/onBlur の型安全性
// ===================================================================

const field = simpleForm.register('username');

// onChange は正しい型のみ受け入れる
field.onChange('new value');
expectError(field.onChange(123));

// onBlur は引数なし
field.onBlur();
expectError(field.onBlur('unexpected'));

// ===================================================================
// テスト7: UseFormReturn の型
// ===================================================================

expectType<UseFormReturn<SimpleForm>>(simpleForm);
expectAssignable<{
  values: SimpleForm;
  errors: Partial<Record<keyof SimpleForm, string>>;
  touched: Partial<Record<keyof SimpleForm, boolean>>;
  isSubmitting: boolean;
}>(simpleForm);

// ===================================================================
// テスト8: バリデータ関数の第2引数（values 全体へのアクセス）
// ===================================================================

type PasswordForm = {
  password: string;
  confirmPassword: string;
};

const passwordValidators: Validators<PasswordForm> = {
  confirmPassword: (value, values) => {
    // values から他のフィールドにアクセスできる
    expectType<PasswordForm>(values);
    expectType<string>(values.password);

    if (value !== values.password) {
      return 'Passwords must match';
    }
    return null;
  },
};

// ===================================================================
// テスト9: validateField と validateAll の型安全性
// ===================================================================

// validateField は存在するキーのみ受け入れる
expectType<boolean>(simpleForm.validateField('username'));
expectType<boolean>(simpleForm.validateField('age'));
expectError(simpleForm.validateField('invalid'));

// validateAll は boolean を返す
expectType<boolean>(simpleForm.validateAll());

// ===================================================================
// テスト10: reset の型安全性
// ===================================================================

// reset は引数なしで呼べる
simpleForm.reset();

// reset は TValues 型の値を受け入れる
simpleForm.reset({ username: 'new', age: 30 });

// 型が合わない値はコンパイルエラー
expectError(simpleForm.reset({ username: 123, age: 30 }));
expectError(simpleForm.reset({ username: 'new', age: 'invalid' }));
expectError(simpleForm.reset({ invalid: 'field' }));

// ===================================================================
// テスト11: handleSubmit の型安全性
// ===================================================================

const handleSubmit = simpleForm.handleSubmit((values) => {
  // callback の引数は TValues 型
  expectType<SimpleForm>(values);
  expectType<string>(values.username);
  expectType<number>(values.age);
});

// handleSubmit は関数を返す
expectType<(e?: unknown) => void>(handleSubmit);
