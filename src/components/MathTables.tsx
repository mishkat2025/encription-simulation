// Tables that show the working of the two algorithms RSA and Diffie-Hellman
// rely on: square-and-multiply, and the extended Euclidean algorithm.

import type { ReactNode } from 'react';
import type { InverseTrace, PowTrace } from '../labs/numberTheory';
import { cx } from './ui';

const th = 'border-b border-line px-3 py-1.5 text-right font-sans text-xs font-medium text-ink-2';
const td = 'border-b border-line px-3 py-1.5 text-right tabular-nums';

/** A line of maths in the monospace font. */
export function Formula({ children }: { children: ReactNode }) {
  return <p className="m-0 font-mono text-sm leading-relaxed text-ink">{children}</p>;
}

/** base^exponent mod n, one row per bit of the exponent. */
export function PowTable({ trace }: { trace: PowTrace }) {
  const { base, exponent, modulus } = trace;
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-sm leading-relaxed text-ink-2">
        The exponent {exponent} is <span className="font-mono text-ink">{trace.binary}</span> in binary. Read its bits
        from the right: for a 1, multiply the result y by a. Then square a for the next bit. That takes{' '}
        {trace.rows.length} {trace.rows.length === 1 ? 'row' : 'rows'}, not {exponent} multiplications.
      </p>
      <div className="scroll-thin overflow-x-auto">
        <table className="border-collapse font-mono text-sm">
          <thead>
            <tr>
              <th className={th}>bit</th>
              <th className={th}>
                a = {base}
                <sup>2ⁱ</sup> mod {modulus}
              </th>
              <th className={cx(th, 'text-left')}>result y</th>
            </tr>
          </thead>
          <tbody>
            {trace.rows.map((row, index) => {
              const previousY = index === 0 ? 1 % modulus : trace.rows[index - 1].y;
              return (
                <tr key={row.i} className={row.bit === 1 ? 'text-ink' : 'text-muted'}>
                  <td className={cx(td, 'font-semibold')}>{row.bit}</td>
                  <td className={td}>{row.a}</td>
                  <td className={cx(td, 'text-left whitespace-nowrap')}>
                    {row.bit === 1 ? (
                      <>
                        {previousY} × {row.a} mod {modulus} = <span className="font-semibold">{row.y}</span>
                      </>
                    ) : (
                      <>{row.y} (unchanged)</>
                    )}
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

/** The extended Euclidean algorithm for the inverse of b modulo n. */
export function EuclidTable({ trace, modulus }: { trace: InverseTrace; modulus: number }) {
  const columns = ['q', 'r1', 'r2', 'r', 't1', 't2', 't'] as const;
  return (
    <div className="flex flex-col gap-2">
      <div className="scroll-thin overflow-x-auto">
        <table className="border-collapse font-mono text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className={th}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.rows.map((row, index) => (
              <tr key={index} className="text-ink">
                {columns.map((column) => (
                  <td key={column} className={td}>
                    {String(row[column]).replace('-', '−')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-sm leading-relaxed text-ink-2">
        Each row divides r1 by r2 (quotient q, remainder r) and updates t = t1 − q × t2. When the remainder r reaches
        0, the t2 in that row is the inverse: {String(trace.rawT).replace('-', '−')}
        {trace.inverse !== null && trace.rawT < 0 && (
          <>
            , which is {trace.inverse} after adding {modulus}
          </>
        )}
        .
      </p>
    </div>
  );
}
