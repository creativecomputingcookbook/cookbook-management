'use client';

type InputField = Record<string | number, string | string[] | File | InputField[] | undefined>;

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
  extra_properties?: Record<string, string | Record<string, string>[] | undefined>;
  binding?: string;
  transform?: string;
};

interface PageData {
  title: string;
  thumbnail: string;
  shortDesc: string;
  schema?: string
  tags: string[];
  fields: InputField[];
}

interface FormFieldProps {
  field: SchemaField;
  value?: InputField;
  onChange: (value: InputField) => void;
  hideHeading: boolean;
}

export type { InputField, SchemaField, Schema, PageData, FormFieldProps };