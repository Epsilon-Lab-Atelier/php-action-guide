import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [template, style, url, discovery, usage, retail, social, admin, catalog, breachCatalog, directory, profiles, breaches, incidentModel, updates, memo, session, navigation, savedServices, app] = await Promise.all(['src/index.html','src/style.css','src/url.mjs','src/discovery.mjs','src/usage.mjs','src/catalog-retail.mjs','src/catalog-social.mjs','src/catalog-admin.mjs','src/catalog.mjs','src/catalog-breach.mjs','src/service-directory.mjs','src/usage-profiles.mjs','src/incidents.mjs','src/incident-model.mjs','src/updates.mjs','src/memo.mjs','src/session.mjs','src/navigation.mjs','src/saved-services.mjs','src/app.mjs'].map(read));
// Only project-owned modules are bundled; no network or third-party dependencies.
const script = [url, discovery, usage, retail, social, admin, catalog, breachCatalog, directory, profiles, breaches, incidentModel, updates, memo, session, navigation, savedServices, app].map(s => s.replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '')).join('\n');
if (/<\/script/i.test(script) || /<\/style/i.test(style)) throw new Error('Unsafe closing tag in bundle');
const hash = s => createHash('sha256').update(s).digest('base64');
const brandImage = `data:image/png;base64,${(await readFile(new URL('../src/assets/epsilon-mark.png', import.meta.url))).toString('base64')}`;
const csp = `default-src 'none'; script-src 'sha256-${hash(script)}'; style-src 'sha256-${hash(style)}'; connect-src 'none'; img-src data:; base-uri 'none'; form-action 'none'; object-src 'none'`;
const html = template.replace('__CSP__',csp).replace('__STYLE__',() => style).replace('__SCRIPT__',() => script).replaceAll('__BRAND_IMAGE__',brandImage);
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/index.html',import.meta.url),html);
await writeFile(new URL('../dist/.nojekyll',import.meta.url),'');
console.log(`Built dist/index.html (${Buffer.byteLength(html)} bytes)`);
