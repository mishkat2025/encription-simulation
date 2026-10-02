// The code beside the animation: pseudocode or real code in Python, Java,
// C++ or C. The lines that belong to the current step are highlighted.

import { Fragment, useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '../components/Icons';
import { cx } from '../components/ui';
import { code, LANGUAGES, parseCode, type CodeLine, type Language } from './code';

const KEYWORDS: Record<Language, string[]> = {
  pseudocode: ['for', 'from', 'to', 'down', 'while', 'if', 'else', 'return', 'and', 'or', 'stop', 'swap'],
  python: ['def', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'and', 'or', 'not', 'break', 'True', 'False', 'None'],
  java: ['static', 'return', 'if', 'else', 'for', 'while', 'break', 'new', 'true', 'false'],
  cpp: ['return', 'if', 'else', 'for', 'while', 'break', 'true', 'false', 'const'],
  c: ['return', 'if', 'else', 'for', 'while', 'break', 'const'],
};
const TYPES = ['int', 'void', 'boolean', 'bool', 'vector'];

/** Splits one line into coloured pieces: comments, numbers, keywords, types and function names. */
function highlight(line: string, language: Language) {
  const comment = language === 'python' ? '#' : language === 'pseudocode' ? null : '//';
  const at = comment ? line.indexOf(comment) : -1;
  const body = at >= 0 ? line.slice(0, at) : line;
  const pieces: { text: string; className?: string }[] = [];
  const token = /\b(\d+)\b|\b([A-Za-z_]\w*)\b(\s*\()?/g;
  let last = 0;
  for (let match = token.exec(body); match; match = token.exec(body)) {
    if (match.index > last) pieces.push({ text: body.slice(last, match.index) });
    const [whole, number, word, call] = match;
    if (number) pieces.push({ text: number, className: 'tok-number' });
    else if (KEYWORDS[language].includes(word)) pieces.push({ text: whole, className: 'tok-keyword' });
    else if (TYPES.includes(word) && language !== 'pseudocode') pieces.push({ text: whole, className: 'tok-type' });
    else if (call) {
      pieces.push({ text: word, className: 'tok-fn' });
      pieces.push({ text: call });
    } else pieces.push({ text: whole });
    last = match.index + whole.length;
  }
  if (last < body.length) pieces.push({ text: body.slice(last) });
  if (at >= 0) pieces.push({ text: line.slice(at), className: 'tok-comment' });
  return pieces;
}

/** The language the visitor picked last time, remembered across topics. */
function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem('code-language');
    if (LANGUAGES.some((language) => language.id === saved)) return saved as Language;
  } catch {
    // Storage can be blocked. Fall back to the default.
  }
  return 'pseudocode';
}

export function CodePanel({ algorithmId, pseudocode, line }: { algorithmId: string; pseudocode: string[]; line: number }) {
  const [language, setLanguage] = useState<Language>(savedLanguage);
  const [copied, setCopied] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const lines: CodeLine[] =
    language === 'pseudocode'
      ? pseudocode.map((text, index) => ({ text, step: index }))
      : parseCode(code[algorithmId]?.[language] ?? '');

  const choose = (next: Language) => {
    setLanguage(next);
    try {
      localStorage.setItem('code-language', next);
    } catch {
      // Not remembered this time; the choice still applies.
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(lines.map((l) => l.text).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Scroll the code box (not the page) so the highlighted line stays in view.
  useEffect(() => {
    const box = scroller.current;
    const first = box?.querySelector<HTMLElement>('[data-current="true"]');
    if (!box || !first) return;
    const top = first.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 40) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' });
    }
  }, [line, language]);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-sunken">
      <div className="flex items-center justify-between gap-2 border-b border-line px-2">
        <div className="scroll-thin flex gap-1 overflow-x-auto" role="tablist" aria-label="Code language">
          {LANGUAGES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={language === option.id}
              onClick={() => choose(option.id)}
              className={cx(
                '-mb-px border-b-2 px-2.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors',
                language === option.id ? 'border-accent-ink text-ink' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy the code"
          title="Copy the code"
          className="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div ref={scroller} className="scroll-thin relative max-h-[26rem] overflow-auto py-2">
        <table className="w-full border-collapse font-mono text-[12px] leading-6">
          <tbody>
            {lines.map((codeLine, index) => {
              const current = codeLine.step !== undefined && codeLine.step === line;
              return (
                <tr key={index} data-current={current} className={cx('transition-colors', current && 'bg-accent-soft')}>
                  <td
                    className={cx(
                      'w-9 border-l-2 pr-3 pl-2 text-right align-top text-[11px] text-muted tabular-nums select-none',
                      current ? 'border-accent-ink' : 'border-transparent',
                    )}
                  >
                    {index + 1}
                  </td>
                  <td
                    className={cx(
                      'pr-4',
                      // Pseudocode is prose-like, so it wraps. Real code keeps its indentation and scrolls.
                      language === 'pseudocode' ? 'whitespace-pre-wrap' : 'whitespace-pre',
                      current ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {highlight(codeLine.text, language).map((piece, i) => (
                      <Fragment key={i}>
                        {piece.className ? <span className={piece.className}>{piece.text}</span> : piece.text}
                      </Fragment>
                    ))}
                    {codeLine.text === '' && ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
