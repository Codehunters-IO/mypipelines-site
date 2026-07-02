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

  // Categories / stacks
  'category.github-actions': 'GitHub Actions',
  'category.gitlab-ci': 'GitLab CI',
  'category.jenkins': 'Jenkins',
  'category.circleci': 'CircleCI',
  'category.azure-devops': 'Azure DevOps',
  'category.java': 'Java (Spring Boot)',
  'category.krakend': 'KrakenD',
  'category.react': 'React',
  'category.nginx': 'NGINX',
  'category.contracts': 'Contracts',
  'category.shared': 'Shared',

  // Theme
  'theme.toggleLabel': 'Cambiar tema',

  // Table of Contents
  'toc.summary': 'En esta página',
  'toc.itemsLabel': 'elementos',

  // Accessibility
  'a11y.skipToContent': 'Saltar al contenido',

  // Search
  'search.label': 'Buscar',
  'search.placeholder': 'Buscar pipelines…',
  'search.openAriaLabel': 'Abrir búsqueda',
  'search.dialogAriaLabel': 'Buscar pipelines',
  'search.empty': 'Escribe para buscar pipelines.',
  'search.noResults': 'Sin resultados para',
  'search.resultsLabel': 'resultados',
  'search.hintNavigate': 'navegar',
  'search.hintSelect': 'abrir',
  'search.hintClose': 'cerrar',
} as const;

export type UiKey = keyof typeof strings;

export function t(_lang: string, key: UiKey | `category.${string}`): string {
  return (strings as Record<string, string>)[key] ?? key;
}
