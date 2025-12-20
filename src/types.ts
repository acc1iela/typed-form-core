export type Validators<T> = {
  [K in keyof T]?: (value: T[K], values: T) => string | null;
};

export type Errors<T> = Partial<Record<keyof T, string>>;
