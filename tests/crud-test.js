/* global describe, it, afterEach, expect, TestHelpers */
describe('Evidencija — osnovni CRUD', () => {
  let ocisti;
  afterEach(() => { if (ocisti) ocisti(); ocisti = null; });

  it('baca izuzetak za neispravnu tabelu', () => {
    const E = TestHelpers.dajEvidenciju();
    expect(() => E(document.createElement('div'))).to.throw('Neispravna tabela!');
    expect(() => E(null)).to.throw('Neispravna tabela!');
  });

  it('učitava mjerenja iz tabele', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['plin', '5', '2026-02-20', 'da'],
    ]);
    ocisti = c;
    expect(TestHelpers.dajEvidenciju()(tabela).brojMjerenja()).to.equal(2);
  });

  it('dodaje validno mjerenje', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([]);
    ocisti = c;
    const ev = TestHelpers.dajEvidenciju()(tabela);
    const r = ev.dodajMjerenje({
      energent: 'struja', kolicina: 12.5,
      datum: TestHelpers.datumUGodini(4, 10), incident: false
    });
    expect(r.uspjesno).to.equal(true);
    expect(ev.brojMjerenja()).to.equal(1);
    expect(tabela.querySelectorAll('tbody tr').length).to.equal(1);
    expect(tabela.querySelector('tbody tr').hasAttribute('data-id')).to.equal(true);
  });

  it('odbija negativnu količinu', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([]);
    ocisti = c;
    const r = TestHelpers.dajEvidenciju()(tabela).dodajMjerenje({
      energent: 'struja', kolicina: -5,
      datum: TestHelpers.datumUGodini(4, 10), incident: false
    });
    expect(r.uspjesno).to.equal(false);
    expect(r.greske.length).to.be.greaterThan(0);
  });

  it('uklanja mjerenje po id-u', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const ev = TestHelpers.dajEvidenciju()(tabela);
    const id = ev.dajMjerenja()[0].id;
    expect(ev.ukloniMjerenje(id)).to.equal(true);
    expect(ev.brojMjerenja()).to.equal(0);
    expect(tabela.querySelectorAll('tbody tr').length).to.equal(0);
  });

  it('azuriraMjerenje mijenja stanje', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const ev = TestHelpers.dajEvidenciju()(tabela);
    const id = ev.dajMjerenja()[0].id;
    const r = ev.azurirajMjerenje(id, { kolicina: 20 });
    expect(r.uspjesno).to.equal(true);
    expect(ev.dajMjerenja()[0].kolicina).to.equal(20);
  });

  it('azuriraMjerenje odbija nevalidne izmjene', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const ev = TestHelpers.dajEvidenciju()(tabela);
    const id = ev.dajMjerenja()[0].id;
    const r = ev.azurirajMjerenje(id, { kolicina: -1 });
    expect(r.uspjesno).to.equal(false);
    expect(ev.dajMjerenja()[0].kolicina).to.equal(10);
  });

  it('svako mjerenje ima jedinstven data-id', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const ev = TestHelpers.dajEvidenciju()(tabela);
    ev.dodajMjerenje({ energent: 'plin', kolicina: 2, datum: TestHelpers.datumUGodini(4, 10), incident: false });
    const ids = ev.dajMjerenja().map(m => m.id);
    expect(new Set(ids).size).to.equal(ids.length);
  });
});