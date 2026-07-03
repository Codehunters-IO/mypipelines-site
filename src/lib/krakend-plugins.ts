// Custom KrakenD Go plugins (edge), from the Codehunters krakend-gateway.
// Curated — not from ci-templates. Rendered on the /stacks/krakend page.
export const KRAKEND_REPO = 'https://github.com/Codehunters-IO/krakend-gateway';

export interface KrakendPlugin {
  name: string;        // plugin dir name
  registered: string;  // name KrakenD registers (pluginName)
  title: string;
  description: string;
  config: string[];    // key config fields
}

export const KRAKEND_PLUGINS: KrakendPlugin[] = [
  {
    name: 'jwt-headers',
    registered: 'krakend-jwt-headers',
    title: 'JWT Headers',
    description:
      'AuthN de borde: valida el JWT contra JWKS, mapea claims a headers (sub → x-user-id, roles → x-user-roles) y saltea rutas públicas.',
    config: ['jwks_url', 'issuer', 'cache_ttl_minutes', 'claims_to_headers', 'skip_paths', 'add_ip_header'],
  },
  {
    name: 'trace-context',
    registered: 'krakend-trace-context',
    title: 'Trace Context',
    description:
      'Propaga W3C Trace Context (traceparent) hacia los backends, con fallback a Trace-Id legacy — correlación de trazas de punta a punta.',
    config: [],
  },
  {
    name: 'accept-language',
    registered: 'krakend-accept-language',
    title: 'Accept Language',
    description:
      'Normaliza e inyecta Accept-Language en la request hacia el backend, con un valor por defecto configurable.',
    config: ['default_value'],
  },
  {
    name: 'ip-resolver',
    registered: 'krakend-ip-resolver',
    title: 'IP Resolver',
    description:
      'Resuelve geolocalización del cliente vía API externa (cacheada), con fallback estático. Enriquece la request con país/ciudad.',
    config: ['api_base_url', 'cache_ttl_minutes', 'skip_paths'],
  },
];
