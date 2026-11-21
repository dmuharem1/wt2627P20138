# ODLUKE-S2

## 1. textContent umjesto innerHTML

Red kreiram u `kreirajRed`, a tekst u ćelije ubacujem u `popuniCeliju` preko `textContent`. U tabelu ga dodajem u `dodajMjerenje` ovom linijom: `tbody.appendChild(noviRed);`.

`textContent` sve što dobije upiše kao običan tekst, bez parsiranja HTML-a. Sa `innerHTML` bi browser taj string pretvorio u prave elemente. Za `<script>alert(1)</script>` se ništa ne bi izvršilo, jer skripte ubačene preko `innerHTML` browser ne pokreće, ali bi se npr. `<img src=x onerror=alert(1)>` izvršilo, a to je već XSS. Sa `textContent` se oba unosa samo ispišu kao tekst.

## 2. Zašto `{...mjerenje}` nije dovoljno

Spread kopira samo prvi nivo. Brojevi, stringovi i boolean se kopiraju po vrijednosti, ali `datum` je `Date` objekat pa se kopira samo referenca. Neko bi mogao napisati `evidencija.dajMjerenja()[0].datum.setFullYear(2020)` i tako promijeniti datum u mom privatnom nizu.

Zato imam funkciju `kopirajMjerenje` koja datum pravi iznova: `new Date(mjerenje.datum.getTime())`. Isto radim i u `dodajMjerenje` kad primim datum izvana.

## 3. Zašto `aria-live="polite"`

Poruke u `#poruke` su obične povratne informacije (dodano je, obrisano je, krivi unos), nisu ništa hitno. `polite` čeka da čitač ekrana završi to što trenutno čita pa tek onda pročita poruku. `assertive` bi prekinuo korisnika usred čitanja, a za ovakve poruke to nije potrebno.

## 4. Debounce na submit

Na submit sam stavio blokadu od 300 ms. To nije pravi debounce nego više ograničenje. Prvi klik prođe odmah, a svi ostali u narednih 300 ms se ignorišu. Varijablu `slanjeUtoku` postavljam na true tek kad je dodavanje uspjelo. To je zato što se poslije uspjeha forma resetuje, pa bi drugi klik pao na validaciji i prebrisao poruku "Mjerenje je uspješno dodano".

Bez toga bi brzi dupli klik ili dupli Enter mogao dodati isto mjerenje dva puta, i onda bi ukupna emisija i statistika bili pogrešni.

Kad forma ne bi koristila JS nego običan HTML submit, u tabeli ne bi bilo duplih redova jer se stranica ponovo učita. Ali to ne znači da je dupli klik bezopasan, jer je server možda već primio prvi zahtjev prije nego što browser otkaže navigaciju. Tada bi se to rješavalo na serveru ili tako što se dugme isključi poslije prvog klika.

## 5. Stabilno sortiranje

U `sortirajMjerenja` svakom mjerenju prije sortiranja zapamtim njegov početni indeks (`{ mjerenje, indeks }`). Kad su dvije vrijednosti iste, vratim `a.indeks - b.indeks`, pa ostaju u istom redoslijedu kao prije.

Primjer iz mojih podataka: imam više mjerenja za `struja`, prvo od `04.11.2026.` pa od `01.11.2026.`. Ako sortiram po energentu (`sortirajMjerenja("energent", "asc")`), svi imaju isti ključ, pa ono od 04.11. ostaje ispred onog od 01.11.