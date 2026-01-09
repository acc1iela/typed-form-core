import { useCallback, useState, useMemo } from 'react';
import type { Errors, UseFormOptions, UseFormReturn } from './types';

export function useForm<TValues extends Record<string, unknown>>(
  options: UseFormOptions<TValues>
): UseFormReturn<TValues> {
  const { defaultValues, validators } = options;

  const [values, setValues] = useState<TValues>(defaultValues);
  const [errors, setErrors] = useState<Errors<TValues>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TValues, boolean>>>({});

  const validateField = useCallback(
    <K extends keyof TValues>(name: K): boolean => {
      const validate = validators?.[name];
      if (!validate) {
        setErrors((prev) => {
          if (!(name in prev)) return prev;
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return true;
      }

      const message = validate(values[name], values);
      setErrors((prev) => {
        const next = { ...prev };
        if (message) next[name] = message;
        else delete next[name];
        return next;
      });
      return message == null;
    },
    [validators, values]
  );

  const validateAll = useCallback((): boolean => {
    if (!validators) {
      setErrors({});
      return true;
    }

    let ok = true;
    const nextErrors: Errors<TValues> = {};

    (Object.keys(values) as Array<keyof TValues>).forEach((key) => {
      const validate = validators[key];
      if (!validate) return;

      const message = validate(values[key], values);
      if (message) {
        ok = false;
        nextErrors[key] = message;
      }
    });

    setErrors(nextErrors);
    return ok;
  }, [validators, values]);

  const setValue = useCallback(<K extends keyof TValues>(name: K, value: TValues[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const register = useCallback(
    <K extends keyof TValues>(name: K) => {
      return {
        name,
        value: values[name],
        onChange: (value: TValues[K]) => setValue(name, value),
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));
          validateField(name);
        },
      } as const;
    },
    [setValue, validateField, values]
  );

  const reset = useCallback(
    (nextValues?: TValues) => {
      setValues(nextValues ?? defaultValues);
      setErrors({});
      setTouched({});
    },
    [defaultValues]
  );

  const handleSubmit = useCallback(
    (onValid: (v: TValues) => void) => {
      return (e?: unknown) => {
        // React form submitイベントが来ても依存しない（UIなし方針）
        if (e && typeof (e as { preventDefault?: () => void }).preventDefault === 'function') {
          (e as { preventDefault: () => void }).preventDefault();
        }

        const ok = validateAll();
        if (ok) onValid(values);
      };
    },
    [validateAll, values]
  );

  return {
    values,
    errors,
    touched,
    register,
    setValue,
    validateField,
    validateAll,
    handleSubmit,
    reset,
  };
}
