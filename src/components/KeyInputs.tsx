import type { KeyValues, ParamDef } from '../ciphers/types';
import { ALPHABET } from '../ciphers/util';
import { Button } from './ui';

const field = 'h-10 rounded-lg border border-line-strong bg-sunken px-3 font-mono text-sm text-ink';

/** A random arrangement of the alphabet, for the substitution cipher's key table. */
function shuffledAlphabet(): string {
  const letters = ALPHABET.toUpperCase().split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join('');
}

/** One form field for each part of the cipher's key. */
export function KeyInputs({
  params,
  values,
  onChange,
}: {
  params: ParamDef[];
  values: KeyValues;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {params.map((param) => {
        const value = values[param.id] ?? '';
        const wide = param.kind === 'text';
        return (
          <label key={param.id} className={wide ? 'min-w-0 flex-1 basis-64' : ''}>
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <span className="h-2.5 w-2.5 rounded-sm bg-key" />
              {param.label}
            </span>
            <span className="flex gap-2">
              {param.kind === 'select' ? (
                <select value={value} onChange={(event) => onChange(param.id, event.target.value)} className={field}>
                  {param.options!.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : param.kind === 'number' ? (
                <input
                  type="number"
                  value={value}
                  min={param.min}
                  max={param.max}
                  onChange={(event) => onChange(param.id, event.target.value)}
                  className={`${field} w-24`}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  placeholder={param.placeholder}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => onChange(param.id, event.target.value)}
                  className={`${field} w-full min-w-0`}
                />
              )}
              {param.randomAlphabet && <Button onClick={() => onChange(param.id, shuffledAlphabet())}>Random</Button>}
            </span>
            {param.help && <span className="mt-1.5 block text-xs text-ink-2">{param.help}</span>}
          </label>
        );
      })}
    </div>
  );
}
