import { useCallback, useRef, useState } from 'react';
import type { Errors, UseFormOptions, UseFormReturn } from './types';

export function useForm<TValues extends Record<string, unknown>>(
  options: UseFormOptions<TValues>
): UseFormReturn<TValues> {
  const { defaultValues, validators } = options;

  const defaultValuesRef = useRef(defaultValues);
  const [values, setValues] = useState<TValues>(defaultValues);
  const [errors, setErrors] = useState<Errors<TValues>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TValues, boolean>>>({});

  const validateField = useCallback(
    <K extends keyof TValues>(name: K): boolean => {
      const validate = validators?.[name];
      if (!validate) {
        return true;
      }

      const message = validate(values[name], values);
      setErrors((prev) => {
        const next = { ...prev };
        if (message) next[name] = message;
        else delete next[name];
        return next;
      });
      return message === null;
    },
    [validators, values]
  );

  const validateAll = useCallback((): boolean => {
    if (!validators) {
      setErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return true;
    }

    let ok = true;
    const nextErrors: Errors<TValues> = {};

    (Object.keys(validators) as Array<keyof TValues>).forEach((key) => {
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
      };
    },
    [setValue, validateField, values]
  );

  const reset = useCallback(
    (nextValues?: TValues) => {
      setValues(nextValues ?? defaultValuesRef.current);
      setErrors({});
      setTouched({});
    },
    []
  );

  const handleSubmit = useCallback(
    (onValid: (v: TValues) => void) => {
      return (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();

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
