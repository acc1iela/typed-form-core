export type ValidatorResult = string | null;

export type Validators<TValues extends Record<string, unknown>> = {
  [K in keyof TValues]?: (value: TValues[K], values: TValues) => ValidatorResult;
};

export type Errors<TValues extends Record<string, unknown>> = Partial<
  Record<keyof TValues, string>
>;

export type Touched<TValues extends Record<string, unknown>> = Partial<
  Record<keyof TValues, boolean>
>;

export type UseFormOptions<TValues extends Record<string, unknown>> = {
  defaultValues: TValues;
  validators?: Validators<TValues>;
};

export type RegisterReturn<TValues extends Record<string, unknown>, K extends keyof TValues> = {
  name: K;
  value: TValues[K];
  onChange: (value: TValues[K]) => void;
  onBlur: () => void;
};

export type UseFormReturn<TValues extends Record<string, unknown>> = {
  values: TValues;
  errors: Errors<TValues>;
  touched: Touched<TValues>;

  register: <K extends keyof TValues>(name: K) => RegisterReturn<TValues, K>;

  setValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;

  validateField: <K extends keyof TValues>(name: K) => boolean;
  validateAll: () => boolean;

  handleSubmit: (onValid: (values: TValues) => void) => (e?: unknown) => void;

  reset: (nextValues?: TValues) => void;
};
