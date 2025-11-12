import { SchemaField, InputField } from '../components/SchemaTypes';

export function iFrameValidator(s: SchemaField, f: InputField): InputField {
  if (s.type === 'iframe' && s.transform) {
    const key = s.binding ?? s.id;
    const currentValue = f[key];
    if (typeof currentValue === 'string') {
      const transformed = transformUrl(s.transform, currentValue);
      if (transformed) {
        return { ...f, [key]: transformed };
      } else {
        throw new Error(`Invalid ${s.transform} link for field "${s.name}".`);
      }
    }
  }
  return f;
}

function transformUrl(type: string, url: string): string | null {
  const patterns: Record<string, { match: RegExp[], to: string }> = {
    youtube: {
      match: [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      ],
      to: "https://www.youtube.com/embed/{1}",
    },
    makecode: {
      match: [
        /(?:https?:\/\/)?makecode\.com\/_([a-zA-Z0-9]+)/,
        /(?:https?:\/\/)?maker.makecode\.com\/#pub:_([a-zA-Z0-9]+)/,
      ],
      to: "https://maker.makecode.com/#pub:_{1}",
    },
    arduino: {
      match: [
        /(?:https?:\/\/)?app\.arduino\.cc\/sketches\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})(?:\?view-mode=[a-z]+)?/,
      ],
      to: "https://app.arduino.cc/sketches/{1}?view-mode=embed",
    }
  };
  if (!patterns[type]) return null;
  for (const pattern of patterns[type].match) {
    const match = url.match(pattern);
    if (match) {
      return patterns[type].to.replace(/{([0-9]+)}/g, (s) => match[parseInt(s)] ?? '');
    }
  }
  return null;
}
