export const defaultLocale = 'es' as const;

export type Locale = string;

const strings = {
  // Site identity
  'site.title': 'mypipelines',
  'site.tagline': 'Pipelines CI/CD listos para copiar',
  'home.title': 'mypipelines',

  // Navigation
  'nav.stacks': 'Stacks',
  'nav.guides': 'Guías',
  'nav.reference': 'Referencia',
  'nav.search': 'Buscar',

  // Catalog
  'catalog.title': 'Catálogo de pipelines',
  'catalog.subtitle': 'Workflows reutilizables y templates por stack',

  // Footer
  'footer.tagline': 'Pipelines CI/CD listos para copiar en tu proyecto.',
  'footer.guides': 'Guías',
  'footer.repo': 'Repositorio',
  'footer.builtWith': 'Hecho con Astro · contenido desde ci-templates',
  'footer.source': 'Contenido generado desde el repositorio ci-templates',

  // Breadcrumb
  'breadcrumb.home': 'Inicio',

  // Theme
  'theme.toggleLabel': 'Cambiar tema',

  // Accessibility
  'a11y.skipToContent': 'Saltar al contenido',
} as const;

export type UiKey = keyof typeof strings;

export function t(_lang: string, key: UiKey): string {
  return (strings as Record<string, string>)[key] ?? key;
}
