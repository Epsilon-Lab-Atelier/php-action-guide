/**
 * Parse a user-supplied web address locally. No DNS, HTTP or storage access.
 * Only the normalized public DNS hostname leaves this function.
 */
export function parseInput(input) {
  const fail = (error) => ({ ok: false, error });
  if (typeof input !== 'string' || !input.trim()) {
    return fail('サービスのURLまたはドメインを入力してください。');
  }
  if (input.length > 4096) {
    return fail('入力が長すぎます。ドメイン部分だけを入力してください。');
  }
  if (/[\u0000-\u001f\u007f-\u009f]/u.test(input)) {
    return fail('改行や制御文字を含まないURLを入力してください。');
  }
  const value = input.trim();
  if (/\s/u.test(value) || value.includes('\\')) {
    return fail('空白やバックスラッシュを含まないURLを入力してください。');
  }
  if (value.startsWith('//')) {
    return fail('https://から始まるURLか、ドメインだけを入力してください。');
  }

  const hasHttpScheme = /^https?:\/\//i.test(value);
  // A bare domain may include a port. Other URI schemes are not web addresses.
  const looksLikeDomainPort = /^[^/:?#]+\.[^/:?#]+:\d+(?:[/?#]|$)/u.test(value);
  if (!hasHttpScheme && /^[a-z][a-z\d+.-]*:/i.test(value) && !looksLikeDomainPort) {
    return fail('http://またはhttps://のURLを入力してください。');
  }
  const address = hasHttpScheme ? value : `https://${value}`;
  const authority = address.replace(/^https?:\/\//i, '').split(/[/?#]/u, 1)[0];
  if (!authority || authority.includes('@')) {
    return fail('ログイン情報を含むURLは使えません。ドメインだけを入力してください。');
  }
  if (authority.includes('%')) {
    return fail('ドメイン部分に%を含まないURLを入力してください。');
  }
  if (authority.includes('[') || authority.includes(']')) {
    return fail('IPアドレスは照合対象外です。サービスのドメインを入力してください。');
  }
  const authorityParts = authority.split(':');
  if (authorityParts.length > 2 || (authorityParts.length === 2 && !/^\d+$/u.test(authorityParts[1]))) {
    return fail('URLのポート番号を確認してください。');
  }

  let parsed;
  try {
    parsed = new URL(address);
  } catch {
    return fail('URLの形式を確認してください。例: https://note.com/');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    return fail('ログイン情報のないhttp://またはhttps://のURLを入力してください。');
  }

  // Remove one DNS root dot, but reject multiple trailing dots as empty labels.
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/u, '');
  if (/^\d+\.\d+\.\d+\.\d+$/u.test(hostname)) {
    return fail('IPアドレスは照合対象外です。サービスのドメインを入力してください。');
  }
  const labels = hostname.split('.');
  if (hostname.length > 253 || labels.length < 2 || labels.some((label) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/u.test(label))) {
    return fail('ドメインの形式を確認してください。例: note.com');
  }
  if (['localhost', 'local', 'internal', 'lan', 'home', 'test', 'invalid', 'onion'].includes(labels.at(-1))) {
    return fail('ローカル用などのドメインは照合対象外です。サービスの公開ドメインを入力してください。');
  }
  // URL performs IDNA conversion. Keep actual internationalized names, but
  // reject compatibility characters that would silently become an ASCII name.
  const rawLabels = authorityParts[0].replace(/\.$/u, '').split('.');
  if (/[\u3002\uff0e\uff61]/u.test(authorityParts[0]) || rawLabels.some((label, index) => /[^\x00-\x7f]/u.test(label) && !labels[index]?.startsWith('xn--'))) {
    return fail('ドメインに見た目の似た文字が含まれています。公式のURLを確認してください。');
  }
  return { ok: true, hostname };
}

/** Match only registered domain boundaries; more specific registrations win. */
export function matchHostname(hostname, services) {
  let result = null;
  let specificity = -1;
  for (const service of services) {
    for (const domain of service.domains ?? []) {
      const host = domain.host.toLowerCase().replace(/\.$/u, '');
      const matches = hostname === host || (domain.includeSubdomains === true && hostname.endsWith(`.${host}`));
      if (matches && host.length > specificity) {
        result = service;
        specificity = host.length;
      }
    }
  }
  return result;
}

export function resolveInput(input, services) {
  const parsed = parseInput(input);
  return parsed.ok ? { ...parsed, service: matchHostname(parsed.hostname, services) } : { ...parsed, service: null };
}
