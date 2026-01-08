import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';
import type { Validators } from './types';

describe('useForm', () => {
  // テストケース1: 初期化
  describe('初期化', () => {
    it('defaultValuesで初期化される', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      expect(result.current.values).toEqual({ username: '', age: 0 });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // テストケース2: register
  describe('register', () => {
    it('正しいnameとvalueを返す', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'test', age: 25 },
        })
      );

      const field = result.current.register('username');
      expect(field.name).toBe('username');
      expect(field.value).toBe('test');
    });

    it('onChangeで値が更新される', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      const field = result.current.register('username');

      act(() => {
        field.onChange('newvalue');
      });

      expect(result.current.values.username).toBe('newvalue');
    });

    it('onBlurでtouchedがtrueになる', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      const field = result.current.register('username');

      act(() => {
        field.onBlur();
      });

      expect(result.current.touched.username).toBe(true);
    });

    it('onBlur時にバリデーションが実行される', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
          validators,
        })
      );

      const field = result.current.register('username');

      act(() => {
        field.onBlur();
      });

      expect(result.current.errors.username).toBe('Required');
    });
  });

  // テストケース3: setValues
  describe('setValues', () => {
    it('指定したフィールドの値を更新する', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      act(() => {
        result.current.setValues('age', 30);
      });

      expect(result.current.values.age).toBe(30);
      expect(result.current.values.username).toBe(''); // 他のフィールドは不変
    });

    it('複数のフィールドを連続して更新できる', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      act(() => {
        result.current.setValues('username', 'john');
        result.current.setValues('age', 25);
      });

      expect(result.current.values).toEqual({ username: 'john', age: 25 });
    });
  });

  // テストケース4: validateField
  describe('validateField', () => {
    it('validatorがない場合はtrueを返す', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('username');
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('validatorがnullを返す場合はエラーなし', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'test' },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('username');
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.username).toBeUndefined();
    });

    it('validatorがstringを返す場合はエラー設定', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('username');
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.username).toBe('Required');
    });

    it('validatorはvaluesも受け取れる（相互依存チェック）', () => {
      const validators: Validators<{ password: string; confirm: string }> = {
        confirm: (value, values) =>
          value === values.password ? null : 'Passwords must match',
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { password: 'secret', confirm: 'different' },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('confirm');
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.confirm).toBe('Passwords must match');
    });

    it('既存のエラーをクリアできる', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
          validators,
        })
      );

      // 最初にエラーを設定
      act(() => {
        result.current.validateField('username');
      });
      expect(result.current.errors.username).toBe('Required');

      // 値を更新
      act(() => {
        result.current.setValues('username', 'valid');
      });

      // 値が更新された状態でバリデーション
      act(() => {
        result.current.validateField('username');
      });
      expect(result.current.errors.username).toBeUndefined();
    });
  });

  // テストケース5: validateAll
  describe('validateAll', () => {
    it('すべてのフィールドをバリデーションする', () => {
      const validators: Validators<{ username: string; email: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
        email: (value) => (value.includes('@') ? null : 'Invalid email'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', email: 'invalid' },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors).toEqual({
        username: 'Required',
        email: 'Invalid email',
      });
    });

    it('すべてのフィールドが有効な場合はtrueを返す', () => {
      const validators: Validators<{ username: string; email: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
        email: (value) => (value.includes('@') ? null : 'Invalid email'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'john', email: 'john@example.com' },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('validatorsがない場合はtrueを返す', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', email: '' },
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('一部のフィールドのみバリデータがある場合', () => {
      const validators: Validators<{ username: string; age: number }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
        // ageにはバリデータなし
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
          validators,
        })
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAll();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors).toEqual({
        username: 'Required',
      });
    });
  });

  // テストケース6: handleSubmit
  describe('handleSubmit', () => {
    it('バリデーション成功時にonValidが呼ばれる', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'john' },
          validators,
        })
      );

      const onValid = vi.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      act(() => {
        submitHandler();
      });

      expect(onValid).toHaveBeenCalledWith({ username: 'john' });
      expect(onValid).toHaveBeenCalledTimes(1);
    });

    it('バリデーション失敗時にonValidが呼ばれない', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
          validators,
        })
      );

      const onValid = vi.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      act(() => {
        submitHandler();
      });

      expect(onValid).not.toHaveBeenCalled();
      expect(result.current.errors.username).toBe('Required');
    });

    it('preventDefaultを呼ぶ（フォームイベント対応）', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'john' },
        })
      );

      const onValid = vi.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      const mockEvent = {
        preventDefault: vi.fn(),
      };

      act(() => {
        submitHandler(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('preventDefaultがないイベントでもエラーにならない', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'john' },
        })
      );

      const onValid = vi.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      expect(() => {
        act(() => {
          submitHandler({});
        });
      }).not.toThrow();
    });

    it('isSubmittingフラグが設定される', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: 'john' },
        })
      );

      const onValid = vi.fn();
      const submitHandler = result.current.handleSubmit(onValid);

      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        submitHandler();
      });

      // 同期処理なので即座にfalseに戻る
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // テストケース7: reset
  describe('reset', () => {
    it('defaultValuesにリセットする', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      act(() => {
        result.current.setValues('username', 'changed');
        result.current.setValues('age', 30);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual({ username: '', age: 0 });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('引数で新しい値を指定してリセットできる', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '', age: 0 },
        })
      );

      act(() => {
        result.current.reset({ username: 'newdefault', age: 99 });
      });

      expect(result.current.values).toEqual({ username: 'newdefault', age: 99 });
    });

    it('resetでエラーとtouchedもクリアされる', () => {
      const validators: Validators<{ username: string }> = {
        username: (value) => (value.length > 0 ? null : 'Required'),
      };

      const { result } = renderHook(() =>
        useForm({
          defaultValues: { username: '' },
          validators,
        })
      );

      // エラーとtouchedを設定
      act(() => {
        const field = result.current.register('username');
        field.onBlur();
      });

      expect(result.current.errors.username).toBe('Required');
      expect(result.current.touched.username).toBe(true);

      // reset実行
      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  // エッジケースのテスト
  describe('エッジケース', () => {
    it('空のdefaultValuesでも動作する', () => {
      const { result } = renderHook(() =>
        useForm({
          defaultValues: {},
        })
      );

      expect(result.current.values).toEqual({});
    });

    it('複雑な型でも動作する', () => {
      type ComplexForm = {
        string: string;
        number: number;
        boolean: boolean;
        nullable: string | null;
      };

      const { result } = renderHook(() =>
        useForm<ComplexForm>({
          defaultValues: {
            string: 'test',
            number: 42,
            boolean: true,
            nullable: null,
          },
        })
      );

      expect(result.current.values).toEqual({
        string: 'test',
        number: 42,
        boolean: true,
        nullable: null,
      });

      // 各フィールドの型安全性を確認
      act(() => {
        result.current.setValues('string', 'updated');
        result.current.setValues('number', 100);
        result.current.setValues('boolean', false);
        result.current.setValues('nullable', 'not null');
      });

      expect(result.current.values).toEqual({
        string: 'updated',
        number: 100,
        boolean: false,
        nullable: 'not null',
      });
    });
  });
});
