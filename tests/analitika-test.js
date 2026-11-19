/* global describe, it, afterEach, expect, TestHelpers */
describe('Evidencija — analitika (osnovno)', () => {
  let ocisti;
  afterEach(() => { if (ocisti) ocisti(); ocisti = null; });

  it('ukupna emisija sa default faktorima', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['plin', '5', '2026-02-20', 'ne'],
    ]);
    ocisti = c;
    expect(TestHelpers.dajEvidenciju()(tabela).dajUkupnuEmisiju()).to.equal(15);
  });

  it('statistika po energentu', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['struja', '20', '2026-02-15', 'ne'],
      ['plin', '5', '2026-02-20', 'ne'],
    ]);
    ocisti = c;
    const s = TestHelpers.dajEvidenciju()(tabela).dajStatistikuPoEnergentu();
    expect(s.struja.broj).to.equal(2);
    expect(s.struja.ukupno).to.equal(30);
    expect(s.struja.prosjek).to.equal(15);
    expect(s.struja.min).to.equal(10);
    expect(s.struja.max).to.equal(20);
    expect(s.voda).to.equal(undefined);
  });

  it('filter po energentu', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['plin', '5', '2026-02-20', 'ne'],
    ]);
    ocisti = c;
    expect(TestHelpers.dajEvidenciju()(tabela).dajMjerenja({ energent: 'struja' }).length).to.equal(1);
  });

  it('detektuje incident', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['plin', '5', '2026-02-20', 'da'],
    ]);
    ocisti = c;
    const a = TestHelpers.dajEvidenciju()(tabela).detektujAnomalije();
    expect(a.some(x => x.razlog === 'incident')).to.equal(true);
  });

  it('generisiIzvjestaj("json") vraća parsirajući JSON', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const parsed = JSON.parse(TestHelpers.dajEvidenciju()(tabela).generisiIzvjestaj('json'));
    expect(Array.isArray(parsed)).to.equal(true);
    expect(parsed[0].energent).to.equal('struja');
  });

  it('generisiIzvjestaj("csv") vraća tekst sa zaglavljem', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    const csv = TestHelpers.dajEvidenciju()(tabela).generisiIzvjestaj('csv');
    expect(csv.toLowerCase()).to.include('energent');
    expect(csv.toLowerCase()).to.include('struja');
  });

  it('generisiIzvjestaj("nepoznat") vraća prazan string', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
    ]);
    ocisti = c;
    expect(TestHelpers.dajEvidenciju()(tabela).generisiIzvjestaj('xml')).to.equal('');
  });

  it('grupisiPoDanu grupiše po datumu u rastućem poretku', () => {
    const { tabela, ocisti: c } = TestHelpers.napraviTabelu([
      ['struja', '10', '2026-01-15', 'ne'],
      ['plin', '5', '2026-01-15', 'ne'],
      ['voda', '100', '2026-01-16', 'ne'],
    ]);
    ocisti = c;
    const g = TestHelpers.dajEvidenciju()(tabela).grupisiPoDanu();
    const keys = Object.keys(g);
    expect(g[keys[0]].length).to.equal(2);
    expect(g[keys[1]].length).to.equal(1);
    expect(keys[0] < keys[1]).to.equal(true);
  });
});