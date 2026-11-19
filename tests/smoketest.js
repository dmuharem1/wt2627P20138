/* global describe, it, beforeEach, afterEach, expect, TestHelpers */
describe('app.js — smoke test (stvarni index.html studenta)', () => {
  let sandbox;
  beforeEach(async () => { sandbox = await TestHelpers.ucitajIframe('../index.html'); });
  afterEach(() => { if (sandbox) sandbox.ocisti(); sandbox = null; });

  it('date input ima dinamički postavljen min/max', () => {
    const d = sandbox.document.querySelector('input[type=date]');
    expect(d).to.exist;
    const g = new Date().getFullYear();
    expect(d.min).to.equal(`${g}-01-01`);
    expect(d.max).to.equal(`${g}-12-31`);
  });

  it('#poruke ima aria-live="polite" i role="status"', () => {
    const p = sandbox.document.querySelector('#poruke');
    expect(p).to.exist;
    expect(p.getAttribute('aria-live')).to.equal('polite');
    expect(p.getAttribute('role')).to.equal('status');
  });

  it('submit dodaje red u tabelu', () => {
    const { document, window } = sandbox;
    const prije = document.querySelectorAll('tbody tr').length;
    document.querySelector('[name=energent]').value = 'struja';
    document.querySelector('[name=kolicina]').value = '10';
    document.querySelector('[name=datum]').value = TestHelpers.strDatumUGodini(5, 15);
    document.querySelector('[data-testid=forma]').dispatchEvent(
      new window.Event('submit', { bubbles: true, cancelable: true })
    );
    expect(document.querySelectorAll('tbody tr').length - prije).to.equal(1);
  });
});