import { Schema } from "@/components/SchemaTypes";

// Utility to extract image field paths from a schema JSON
export function getImageFields(schema: Schema): string[] {
  const fields: string[] = [];
  if (!schema.components) return fields;
  for (const comp of schema.components) {
    if (comp.type === 'image' && comp.binding) {
      fields.push(comp.binding);
    }
    if (comp.type === 'open_field_list' && comp.choices) {
      for (const choice of comp.choices) {
        if (choice.type === 'image' && choice.binding) {
          // For nested lists, use dot notation
          fields.push(`${comp.binding}.*.${choice.binding}`);
        }
      }
    }
  }
  return fields;
}
