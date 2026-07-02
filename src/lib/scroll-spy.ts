// Shared scroll-spy: highlight the nav link whose target section is in view.
// Used by CatalogSidebar (category list) and ToC (heading list) so the two
// near-identical IntersectionObserver implementations cannot drift (WR-06).

export interface ScrollSpyOptions {
  /** Data attribute on each anchor that holds its target element id (e.g. 'data-cat-link'). */
  linkAttr: string;
  /** IntersectionObserver rootMargin. */
  rootMargin: string;
}

/**
 * Wires an IntersectionObserver that toggles `data-active` on the anchor whose
 * target section is the top-most one currently intersecting. No-op when no
 * matching anchors/targets exist, so it is safe to call on every page.
 */
export function initScrollSpy({ linkAttr, rootMargin }: ScrollSpyOptions): void {
  const links = new Map<string, HTMLAnchorElement>();
  document
    .querySelectorAll<HTMLAnchorElement>(`[${linkAttr}]`)
    .forEach((a) => {
      const id = a.getAttribute(linkAttr);
      if (id) links.set(id, a);
    });

  const targets = Array.from(links.keys())
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  if (targets.length === 0) return;

  let activeId: string | null = null;
  const setActive = (id: string) => {
    if (id === activeId) return;
    activeId = id;
    links.forEach((a, key) => a.toggleAttribute('data-active', key === id));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin, threshold: 0 }
  );

  targets.forEach((el) => observer.observe(el));
}
