import { ciphers, groups } from '../ciphers';
import type { Cipher } from '../ciphers/types';
import { cx } from './ui';

/**
 * The list of ciphers. Each entry is a plain link to "#cipher-id": the App
 * component listens for the address changing and loads that cipher.
 * On small screens the list becomes a dropdown.
 */
export function Sidebar({ current }: { current: Cipher }) {
  return (
    <nav aria-label="Ciphers">
      <label className="block lg:hidden">
        <span className="mb-1.5 block text-xs font-medium text-ink-2">Cipher</span>
        <select
          value={current.id}
          onChange={(event) => {
            window.location.hash = event.target.value;
          }}
          className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {ciphers
                .filter((cipher) => cipher.group === group)
                .map((cipher) => (
                  <option key={cipher.id} value={cipher.id}>
                    {cipher.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="sticky top-6 hidden space-y-5 lg:block">
        {groups.map((group) => (
          <div key={group}>
            <h2 className="mb-1.5 px-3 text-xs font-medium text-ink-2">{group}</h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {ciphers
                .filter((cipher) => cipher.group === group)
                .map((cipher) => (
                  <li key={cipher.id}>
                    <a
                      href={`#${cipher.id}`}
                      aria-current={cipher.id === current.id ? 'page' : undefined}
                      className={cx(
                        'block rounded-lg px-3 py-2 text-sm no-underline transition-colors',
                        cipher.id === current.id
                          ? 'bg-ink font-medium text-page'
                          : 'text-ink hover:bg-sunken',
                      )}
                    >
                      {cipher.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
