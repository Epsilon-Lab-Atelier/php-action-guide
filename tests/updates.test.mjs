import test from 'node:test';
import assert from 'node:assert/strict';
import { sources } from '../src/catalog.mjs';
import { directoryServices as services } from '../src/service-directory.mjs';
import { breachIncidents, breachSources } from '../src/incidents.mjs';
import { metadataForService, metadataForCatalog, summarizeUpdateMetadata, historyForService, updateHistory, updateTrackedSince, appReleases } from '../src/updates.mjs';

const fixtureService = { id:'fixture', php:{sourceIds:['first']}, incident:{sourceIds:['second']}, supportSourceIds:['first'] };
const fixtureSources = { first:{checkedAt:'2026-10-24'}, second:{checkedAt:'2026-10-24'} };
const fixtureBaseline = {type:'baseline',date:'2026-10-24',serviceIds:['fixture'],sourceIds:[]};
const summarize = (sourceMap=fixtureSources,events=[fixtureBaseline]) => summarizeUpdateMetadata(fixtureService, sourceMap, events, '2026-10-24');

test('baseline alone is not a fabricated service change date', () => {
  assert.deepEqual(summarize(), {checkedAt:'2026-10-24',latestSourceCheckedAt:'2026-10-24',lastChangedAt:null,trackedSince:'2026-10-24'});
});

test('real content history advances change date independently from rereading or baseline', () => {
  const events = [
    {type:'content',date:'2026-10-26',serviceIds:['fixture']},
    {type:'content',date:'2026-10-29',serviceIds:['different-service']},
    {type:'content',date:'2026-10-25',serviceIds:['fixture']},
    fixtureBaseline,
  ];
  const result = summarize({first:{checkedAt:'2026-10-28'},second:{checkedAt:'2026-10-27'}},events);
  assert.equal(result.lastChangedAt,'2026-10-26');
  assert.equal(result.checkedAt,'2026-10-27');
  assert.equal(result.latestSourceCheckedAt,'2026-10-28');
  assert.equal(result.trackedSince,'2026-10-24');
});

test('unknown service has no claimed inspection or change history', () => {
  assert.deepEqual(metadataForService('not-listed'), { checkedAt:null, lastChangedAt:null, trackedSince:null, latestSourceCheckedAt:null });
  assert.deepEqual(historyForService(null), []);
});

test('partial reread uses oldest cited date and exposes latest separately', () => {
  const sources = {first:{checkedAt:'2026-10-24'},second:{checkedAt:'2026-10-25'}};
  assert.equal(summarize(sources).checkedAt,'2026-10-24');
  assert.equal(summarize(sources).latestSourceCheckedAt,'2026-10-25');
  assert.equal(summarize({...sources,second:{checkedAt:null}}).checkedAt,null);
  assert.equal(summarize({...sources,second:{}}).checkedAt,null);
  assert.deepEqual(sources,{first:{checkedAt:'2026-10-24'},second:{checkedAt:'2026-10-25'}});
});

test('PHP and incident sources share the oldest verification date without changing content history', () => {
  const sourceMap = { ...fixtureSources, breach: { checkedAt: '2026-10-20', publishedAt: '2020-08-14' } };
  const events = [fixtureBaseline, {type:'content',date:'2026-10-26',serviceIds:['fixture'],incidentId:'older-disclosure'}];
  const result = summarizeUpdateMetadata(fixtureService, sourceMap, events, '2026-10-24', ['breach', 'breach']);
  assert.deepEqual(result, {checkedAt:'2026-10-20',latestSourceCheckedAt:'2026-10-24',lastChangedAt:'2026-10-26',trackedSince:'2026-10-24'});
  sourceMap.breach.checkedAt = '2026-10-28';
  assert.equal(summarizeUpdateMetadata(fixtureService, sourceMap, events, '2026-10-24', ['breach']).checkedAt, '2026-10-24');
  assert.equal(summarizeUpdateMetadata(fixtureService, sourceMap, events, '2026-10-24', ['breach']).lastChangedAt, '2026-10-26');
});

test('missing or invalid incident verification dates do not give the service a full review date', () => {
  for (const value of [undefined, null, '2026-02-30', '2026-13-01']) {
    const result = summarizeUpdateMetadata(fixtureService, { ...fixtureSources, breach: { checkedAt: value } }, [fixtureBaseline], '2026-10-24', ['breach']);
    assert.equal(result.checkedAt, null);
    assert.equal(result.latestSourceCheckedAt, '2026-10-24');
  }
  assert.equal(summarizeUpdateMetadata(fixtureService, fixtureSources, [fixtureBaseline], '2026-10-24', ['missing']).checkedAt, null);
});

test('UI history copies cannot mutate recorded source or service IDs', () => {
  const serviceId = services.find(service => historyForService(service.id).length)?.id;
  assert.ok(serviceId);
  const original = historyForService(serviceId);
  const changed = historyForService(serviceId);
  changed[0].serviceIds.length = 0;
  changed[0].sourceIds.push('imaginary');
  changed[0].summary = 'changed';
  assert.deepEqual(historyForService(serviceId), original);
});

test('live metadata follows current data without assuming a fixed date or empty changes', () => {
  for (const service of services) {
    const incidentSourceIds = breachIncidents.filter(incident => incident.serviceIds.includes(service.id)).flatMap(incident => incident.sourceIds);
    assert.deepEqual(metadataForService(service.id),summarizeUpdateMetadata(service,{...sources,...breachSources},updateHistory,updateHistory.filter(event=>event.serviceIds.includes(service.id)).map(event=>event.date).sort()[0]??null,incidentSourceIds));
  }
  const dates = services.map(service => metadataForService(service.id).checkedAt);
  assert.equal(metadataForCatalog().checkedAt, dates.every(Boolean) ? dates.sort()[0] : null);
  const changeDates = updateHistory.filter(event => event.type === 'content').map(event => event.date).sort();
  assert.equal(metadataForCatalog().lastChangedAt, changeDates.at(-1) ?? null);
});

test('history and application releases remain separate and link only known IDs', () => {
  const allSources = { ...sources, ...breachSources };
  assert.equal(new Set(updateHistory.map(event => event.id)).size, updateHistory.length);
  for (const event of updateHistory) {
    assert.match(event.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${event.date}T00:00:00Z`).toISOString().slice(0,10),event.date);
    assert.ok(['baseline','content'].includes(event.type));
    for (const id of event.serviceIds) assert.ok(services.some(service => service.id === id));
    for (const id of event.sourceIds) assert.ok(allSources[id]);
    if (event.incidentId) assert.ok(breachIncidents.some(incident => incident.id === event.incidentId));
    assert.ok(event.title && event.summary);
  }
  assert.ok(appReleases[0].version && appReleases[0].summary);
});

test('each incident history entry is a dated guide content change, independent of disclosure dates', () => {
  for (const incident of breachIncidents) {
    const events = updateHistory.filter(event => event.incidentId === incident.id);
    assert.equal(events.length, incident.history.length);
    incident.history.forEach((entry, index) => {
      assert.equal(events[index].type, 'content');
      assert.equal(events[index].date, entry.date);
      assert.deepEqual(events[index].serviceIds, incident.serviceIds);
      assert.deepEqual(events[index].sourceIds, entry.sourceIds ?? incident.sourceIds);
      assert.match(events[index].summary, /発生日・公表日とは異なります/);
      assert.ok(events[index].title.includes(incident.title));
      assert.ok(events[index].title.includes(entry.title));
    });
  }
  assert.equal(updateHistory.filter(event => event.type === 'baseline').length, 1);
  assert.match(appReleases.find(release => release.version === '0.6.0').title, /ネットサービスの確認手帳/);
});

test('newly researched services do not inherit the earlier PHP tracking start date', () => {
  assert.equal(metadataForService('sagawa').trackedSince, '2026-10-25');
  assert.equal(metadataForService('note').trackedSince, '2026-10-24');
});
