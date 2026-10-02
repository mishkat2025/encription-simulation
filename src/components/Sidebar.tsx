import { ciphers, groups } from '../ciphers';
import { labs } from '../labs';
import { cx } from './ui';

/** Every topic in the app, grouped the way the sidebar shows them. */
const sections = [
  ...groups.map((group) => ({
    title: group,
    items: ciphers.filter((cipher) => cipher.group === group).map(({ id, name }) => ({ id, name })),
  })),
  ...[...new Set(labs.map((lab) => lab.group))].map((group) => ({
    title: group,
    items: labs.filter((lab) => lab.group === group).map(({ id, name }) => ({ id, name })),
  })),
];

/**
 * The list of topics. Each entry is a plain link to "#topic-id": the App
 * component listens for the address changing and shows that topic.
 * On small screens the list becomes a dropdown.
 */
export function Sidebar({ currentId }: { currentId: string }) {
  return (
    <nav aria-label="Topics">
      <label className="block lg:hidden">
        <span className="mb-1.5 block text-xs font-medium text-ink-2">Topic</span>
        <select
          value={currentId}
          onChange={(event) => {
            window.location.hash = event.target.value;
          }}
          className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
        >
          {sections.map((section) => (
            <optgroup key={section.title} label={section.title}>
              {section.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="sticky top-6 hidden space-y-5 lg:block">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1.5 px-3 text-xs font-medium text-ink-2">{section.title}</h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {section.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={item.id === currentId ? 'page' : undefined}
                    className={cx(
                      'block rounded-lg px-3 py-2 text-sm no-underline transition-colors',
                      item.id === currentId ? 'bg-accent font-medium text-on-accent' : 'text-ink hover:bg-sunken',
                    )}
                  >
                    {item.name}
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
