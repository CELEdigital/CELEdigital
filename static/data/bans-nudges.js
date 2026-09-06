/* Prohibiciones e incentivos / Bans and nudges.
 *
 * Renders static/data/bans_nudges.json into filterable cards. Every record in
 * that file carries both languages, so the language chosen by Hugo (data-bn-lang)
 * selects a side rather than triggering a second fetch.
 *
 * Companion to layouts/partials/bans-nudges.html. The chrome is server-rendered
 * and translated there; only the strings in data-bn-strings cross over.
 */
(() => {
  const roots = Array.from(document.querySelectorAll('[data-bans-nudges]'));
  if (!roots.length) return;

  const TONE_ORDER = ['live', 'contested', 'pending', 'gone'];
  const OFFICIAL_TIERS = ['statute', 'gazette', 'regulator', 'parliament'];

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  /* Accent- and case-insensitive, so "turkiye" finds "Türkiye". */
  const fold = (value) => (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const pick = (value, lang) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.en || '';
  };

  const pickList = (value, lang) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const side = value[lang] || value.en;
    return Array.isArray(side) ? side : [];
  };

  /* ------------------------------------------------------------------ */

  const buildSource = (source, lang, strings, kindLabel) => {
    if (!source || !source.url) return null;
    const tier = source.kind || '';
    const node = el(source.url ? 'a' : 'div', 'bn-src');
    node.dataset.tier = tier;
    if (source.url) {
      node.href = source.url;
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }

    const tierText = pick(source.tierLabel, lang);
    node.appendChild(el('span', 'bn-src__tier',
      tierText ? `${kindLabel} · ${tierText}` : kindLabel));

    const label = source.label || source.title || source.outlet || source.url;
    node.appendChild(el('span', 'bn-src__label', label));

    /* An outlet plus a date is what makes a status claim checkable, so it is
       shown even when it duplicates part of the label. */
    const bits = [];
    if (source.outlet && source.outlet !== label) bits.push(source.outlet);
    if (source.title && source.title !== label) bits.push(source.title);
    if (source.date) bits.push(source.date);
    if (bits.length) node.appendChild(el('span', 'bn-src__note', bits.join(' · ')));

    return node;
  };

  const buildBody = (rec, lang, strings) => {
    const body = el('div', 'bn-card__body');
    body.hidden = true;

    /* --- what it covers ------------------------------------------- */
    const covers = el('section', 'bn-block');
    covers.appendChild(el('h4', null, strings.covers));

    const dl = el('dl', 'bn-def');
    const row = (label, value, flagUntranslated) => {
      if (!value) return;
      const dt = el('dt', null, label);
      if (flagUntranslated) dt.appendChild(el('span', 'bn-untranslated', strings.untranslated));
      dl.appendChild(dt);
      dl.appendChild(el('dd', null, value));
    };

    /* Scope taken verbatim from the US tracker is English-only; say so rather
       than let a Spanish reader assume it was translated. */
    const whoUntranslated = lang !== 'en' && rec.covered.whoTranslated === false;
    row(strings.who, pick(rec.covered.who, lang), whoUntranslated);
    row(strings.whom, pick(rec.covered.whom, lang), whoUntranslated);
    const exceptions = pickList(rec.covered.exceptions, lang);
    if (exceptions.length) row(strings.exceptions, exceptions.join(' · '), whoUntranslated);
    covers.appendChild(dl);

    const defSource = pick(rec.covered.defSource, lang);
    if (defSource) {
      const box = el('div', 'bn-src');
      box.dataset.tier = rec.covered.defTier || '';
      const tierText = pick(rec.covered.defTierLabel, lang);
      box.appendChild(el('span', 'bn-src__tier',
        tierText ? `${strings.defSource} · ${tierText}` : strings.defSource));
      box.appendChild(el('span', 'bn-src__label', defSource));
      covers.appendChild(box);
    }
    body.appendChild(covers);

    /* --- what it does --------------------------------------------- */
    const does = el('section', 'bn-block');
    does.appendChild(el('h4', null, strings.does));

    const mech = el('dl', 'bn-def');
    mech.appendChild(el('dt', null, strings.mechanism));
    mech.appendChild(el('dd', null,
      `${pick(rec.action.quadrant, lang)} — ${pick(rec.action.mechanism, lang)}`));
    does.appendChild(mech);

    const reqs = pickList(rec.action.requirements, lang);
    if (reqs.length) {
      const heading = el('dl', 'bn-def');
      const dt = el('dt', null, strings.requirements);
      if (lang !== 'en' && rec.action.requirementsTranslated === false) {
        dt.appendChild(el('span', 'bn-untranslated', strings.untranslated));
      }
      heading.appendChild(dt);
      does.appendChild(heading);
      const ul = el('ul', 'bn-reqs');
      reqs.forEach((r) => ul.appendChild(el('li', null, r)));
      does.appendChild(ul);
    }

    if (rec.action.ageVerification) {
      const av = el('dl', 'bn-def');
      av.appendChild(el('dt', null, strings.ageCheck));
      av.appendChild(el('dd', null, rec.action.ageVerification));
      does.appendChild(av);
    }

    const enf = el('dl', 'bn-def');
    const enfText = pick(rec.action.enforcementText, lang) || pick(rec.action.enforcer, lang);
    const enfDt = el('dt', null, strings.enforcement);
    if (lang !== 'en' && rec.action.enforcementTranslated === false) {
      enfDt.appendChild(el('span', 'bn-untranslated', strings.untranslated));
    }
    enf.replaceChildren(enfDt);
    enf.appendChild(el('dd', null, enfText));
    does.appendChild(enf);
    body.appendChild(does);

    /* --- where it stands ------------------------------------------ */
    const stands = el('section', 'bn-block bn-block--wide');
    stands.appendChild(el('h4', null, strings.stands));

    if (rec.status.correction) {
      const flag = el('div', 'bn-flag');
      flag.appendChild(el('strong', null, strings.correction));
      flag.appendChild(document.createTextNode(pick(rec.status.correction, lang)));
      stands.appendChild(flag);
    }

    const note = pick(rec.status.note, lang);
    if (note) stands.appendChild(el('p', 'bn-prose', note));

    if (rec.status.note2) {
      const extra = el('div', 'bn-flag');
      extra.appendChild(el('strong', null, strings.note));
      extra.appendChild(document.createTextNode(pick(rec.status.note2, lang)));
      stands.appendChild(extra);
    }

    if (rec.status.effective) {
      const eff = el('p', 'bn-prose');
      eff.appendChild(el('strong', null, `${strings.effective}: `));
      eff.appendChild(document.createTextNode(rec.status.effective));
      stands.appendChild(eff);
    }

    if (rec.status.history && rec.status.history.length) {
      const heading = el('dl', 'bn-def');
      heading.appendChild(el('dt', null, strings.history));
      stands.appendChild(heading);
      const ul = el('ul', 'bn-history');
      rec.status.history.forEach((h) => ul.appendChild(el('li', null, h)));
      stands.appendChild(ul);
    }
    body.appendChild(stands);

    /* --- sources --------------------------------------------------- */
    const sources = el('section', 'bn-block bn-block--wide');
    sources.appendChild(el('h4', null, strings.sources));

    const primary = buildSource(rec.status.primary, lang, strings, strings.primary);
    if (primary) sources.appendChild(primary);

    const reporting = buildSource(rec.status.reporting, lang, strings, strings.reporting);
    if (reporting) sources.appendChild(reporting);

    if (rec.trackerUrl) {
      const t = el('a', 'bn-src');
      t.dataset.tier = 'tracker';
      t.href = rec.trackerUrl;
      t.target = '_blank';
      t.rel = 'noopener noreferrer';
      t.appendChild(el('span', 'bn-src__tier', strings.tracker));
      t.appendChild(el('span', 'bn-src__label', rec.trackerUrl.replace(/^https?:\/\//, '')));
      sources.appendChild(t);
    }

    if (rec.citedFor) {
      const cited = el('p', 'bn-prose');
      cited.appendChild(el('strong', null, `${strings.citedFor}: `));
      cited.appendChild(document.createTextNode(rec.citedFor));
      sources.appendChild(cited);
    }
    body.appendChild(sources);

    return body;
  };

  const buildCard = (rec, lang, strings) => {
    const card = el('article', 'bn-card');
    card.dataset.tone = rec.status.tone;
    card.dataset.id = rec.id;

    const head = el('button', 'bn-card__head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');

    const meta = el('div', 'bn-card__meta');
    meta.appendChild(el('span', 'bn-card__place', rec.jurisdiction));
    meta.appendChild(el('span', null, String(rec.year)));
    meta.appendChild(el('span', null, pick(rec.region, lang)));
    head.appendChild(meta);

    head.appendChild(el('h3', 'bn-card__name', rec.instrument));

    if (rec.officialTitle && rec.officialTitle !== rec.instrument) {
      head.appendChild(el('p', 'bn-card__official', rec.officialTitle));
    }

    const chips = el('div', 'bn-chips');
    const status = el('span', 'bn-chip bn-chip--status', pick(rec.status.label, lang));
    status.dataset.tone = rec.status.tone;
    chips.appendChild(status);
    chips.appendChild(el('span', 'bn-chip bn-chip--quadrant', pick(rec.action.quadrant, lang)));
    chips.appendChild(el('span', 'bn-chip', pick(rec.action.mechanism, lang)));
    head.appendChild(chips);

    card.appendChild(head);

    const body = buildBody(rec, lang, strings);
    const bodyId = `bn-body-${rec.id}`;
    body.id = bodyId;
    head.setAttribute('aria-controls', bodyId);
    card.appendChild(body);

    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      body.hidden = open;
    });

    return card;
  };

  /* ------------------------------------------------------------------ */

  const init = (root, payload) => {
    const lang = root.dataset.bnLang === 'en' ? 'en' : 'es';
    const stringsNode = root.parentNode.querySelector('[data-bn-strings]')
      || document.querySelector('[data-bn-strings]');
    const strings = stringsNode ? JSON.parse(stringsNode.textContent) : {};

    const records = payload.records;
    const vocab = payload.vocab;

    const listEl = root.querySelector('[data-bn-list]');
    const countEl = root.querySelector('[data-bn-count]');
    const stripEl = root.querySelector('[data-bn-strip]');
    const legendEl = root.querySelector('[data-bn-legend]');
    const searchEl = root.querySelector('[data-bn-search]');
    const resetEl = root.querySelector('[data-bn-reset]');
    const selects = Array.from(root.querySelectorAll('[data-bn-filter]'));

    /* --- populate the selects from the data, in the vocabulary order -- */
    const fillSelect = (name, entries) => {
      const select = selects.find((s) => s.dataset.bnFilter === name);
      if (!select) return;
      entries.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });
    };

    const used = (fn) => new Set(records.map(fn));

    fillSelect('region', Object.entries(vocab.region)
      .filter(([k]) => used((r) => r.regionKey).has(k))
      .map(([k, v]) => [k, v[lang]]));

    fillSelect('quadrant', Object.entries(vocab.quadrant)
      .filter(([k]) => used((r) => r.action.quadrantKey).has(k))
      .map(([k, v]) => [k, v[lang]]));

    fillSelect('mechanism', Object.entries(vocab.mechanism)
      .filter(([k]) => used((r) => r.action.mechanismKey).has(k))
      .map(([k, v]) => [k, v[lang]]));

    fillSelect('status', Object.entries(vocab.state)
      .filter(([k]) => used((r) => r.status.key).has(k))
      .map(([k, v]) => [k, v[lang]]));

    /* --- search index ------------------------------------------------ */
    const haystack = new Map();
    records.forEach((r) => {
      haystack.set(r.id, fold([
        r.jurisdiction, r.instrument, r.officialTitle, r.citation, r.year,
        pick(r.region, lang), pick(r.action.quadrant, lang), pick(r.action.mechanism, lang),
        pick(r.status.label, lang), pick(r.status.note, lang),
        pick(r.covered.who, lang), pick(r.covered.whom, lang),
        pickList(r.action.requirements, lang).join(' '),
      ].join(' ')));
    });

    const cards = new Map();
    records.forEach((rec) => {
      const card = buildCard(rec, lang, strings);
      cards.set(rec.id, card);
      listEl.appendChild(card);
    });

    const empty = el('p', 'bn-empty', strings.empty);
    empty.hidden = true;
    listEl.appendChild(empty);

    /* --- filtering ---------------------------------------------------- */
    const state = { region: '', quadrant: '', mechanism: '', status: '', tier: '', q: '' };

    const matches = (rec) => {
      if (state.region && rec.regionKey !== state.region) return false;
      if (state.quadrant && rec.action.quadrantKey !== state.quadrant) return false;
      if (state.mechanism && rec.action.mechanismKey !== state.mechanism) return false;
      if (state.status && rec.status.key !== state.status) return false;
      if (state.tier) {
        const official = OFFICIAL_TIERS.includes(rec.covered.defTier);
        if (state.tier === 'official' && !official) return false;
        if (state.tier === 'secondary' && official) return false;
      }
      if (state.q && !haystack.get(rec.id).includes(state.q)) return false;
      return true;
    };

    const render = () => {
      const visible = [];
      records.forEach((rec) => {
        const ok = matches(rec);
        cards.get(rec.id).hidden = !ok;
        if (ok) visible.push(rec);
      });

      countEl.innerHTML = '';
      countEl.appendChild(el('b', null, String(visible.length)));
      const noun = visible.length === 1 ? (strings.showingOne || strings.showing) : strings.showing;
      countEl.appendChild(document.createTextNode(
        ` ${noun} ${strings.of} ${records.length}`));

      empty.hidden = visible.length !== 0;

      /* Distribution strip: proportion of the current selection by status
         tone. It moves as filters change, which is the point of showing it. */
      const counts = {};
      visible.forEach((r) => { counts[r.status.tone] = (counts[r.status.tone] || 0) + 1; });

      stripEl.innerHTML = '';
      legendEl.innerHTML = '';
      TONE_ORDER.forEach((tone) => {
        const n = counts[tone] || 0;
        if (!n) return;
        const seg = el('div', 'bn-strip__seg');
        seg.dataset.tone = tone;
        seg.style.flexGrow = String(n);
        seg.style.flexBasis = '0';
        stripEl.appendChild(seg);

        const label = (vocab.tone[tone] && vocab.tone[tone][lang]) || tone;
        const li = el('li');
        li.dataset.tone = tone;
        li.appendChild(el('i'));
        li.appendChild(document.createTextNode(`${label} · ${n}`));
        legendEl.appendChild(li);
      });
    };

    selects.forEach((select) => {
      select.addEventListener('change', () => {
        state[select.dataset.bnFilter] = select.value;
        render();
      });
    });

    let timer = null;
    searchEl.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.q = fold(searchEl.value.trim());
        render();
      }, 120);
    });

    resetEl.addEventListener('click', () => {
      Object.keys(state).forEach((k) => { state[k] = ''; });
      selects.forEach((s) => { s.value = ''; });
      searchEl.value = '';
      render();
    });

    const provenance = root.querySelector('[data-bn-provenance]');
    if (provenance && strings.provenance) {
      provenance.textContent = strings.provenance
        .replace('{count}', payload.meta.count)
        .replace('{built}', payload.meta.built)
        .replace('{tracker}', payload.meta.sources.usScope);
    }

    render();
  };

  roots.forEach((root) => {
    fetch(root.dataset.bnUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((payload) => init(root, payload))
      .catch((err) => {
        const list = root.querySelector('[data-bn-list]');
        if (list) list.appendChild(el('p', 'bn-empty', String(err)));
      });
  });
})();
