'use client';

type InputField = Record<string | number, string | File | InputField[] | undefined>;

interface Schema {
  id: string;
  name: string;
  description?: string;
  components: SchemaField[];
}

interface SchemaField {
  id: string;
  type: string;
  name?: string;
  description?: string;
  choices?: SchemaField[];
  extra_inputs?: SchemaField[];
  extra_properties?: Record<string, string>;
  binding?: string;
  transform?: string[];
};

interface FormFieldProps {
  field: SchemaField;
  value?: InputField;
  onChange: (value: InputField) => void;
  hideHeading: boolean;
}

export type { InputField, SchemaField, Schema, FormFieldProps };