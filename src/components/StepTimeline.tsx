// A numbered list of steps that opens up one at a time. Used by the RSA page,
// where each step is a small calculation done by Alice or Bob.

import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cx } from './ui';

export interface TimelineStep {
  title: string;
  /** Who does this step, for example "Bob". */
  actor?: string;
  /** Whether the values in this step are kept secret or published. */
  visibility?: 'private' | 'public';
  content: ReactNode;
}

export function StepTimeline({ steps, step }: { steps: TimelineStep[]; step: number }) {
  const current = useRef<HTMLLIElement>(null);

  // Bring the newly opened step into view, without jumping if it is already visible.
  useEffect(() => {
    if (step > 0) current.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [step]);

  return (
    <ol className="m-0 list-none space-y-2 p-0">
      {steps.map((item, index) => {
        const open = index < step;
        const isCurrent = index === step - 1;
        return (
          <li
            key={item.title}
            ref={isCurrent ? current : undefined}
            className={cx(
              'scroll-mt-24 rounded-lg border px-3 py-3 transition-colors sm:px-4',
              isCurrent ? 'border-line-strong bg-sunken' : 'border-line',
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  open ? 'bg-accent text-on-accent' : 'border border-line-strong text-muted',
                )}
              >
                {index + 1}
              </span>
              <h3 className={cx('m-0 text-sm font-semibold', open ? 'text-ink' : 'text-muted')}>{item.title}</h3>
              <span className="ml-auto flex gap-1.5 text-xs">
                {item.actor && <span className="rounded-full border border-line-strong px-2 py-0.5 text-ink-2">{item.actor}</span>}
                {item.visibility && (
                  <span className="rounded-full border border-line-strong px-2 py-0.5 text-ink-2">
                    {item.visibility === 'private' ? 'kept secret' : 'public'}
                  </span>
                )}
              </span>
            </div>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 sm:pl-9"
              >
                {item.content}
              </motion.div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
