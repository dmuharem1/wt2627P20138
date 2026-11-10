# ODLUKE

## 1. Flexbox ili Grid

Za raspored radnog prostora i sidebara koristio sam Flexbox jer sam želio da ta dva dijela budu jedan pored drugog. Radni prostor zauzima veći dio širine, dok sidebar zauzima manje prostora. Kada nema dovoljno mjesta, elementi se pomoću flex-wrap: wrap automatski prebacuju jedan ispod drugog. Tako nisam morao dodavati posebna pravila za manje ekrane. Mogao sam koristiti i Grid, ali mi je Flexbox ovdje bio jednostavniji jer se radi o dva glavna elementa koja raspoređujem u jednom pravcu.

Za raspored tri kartice na kontrolnoj tabli koristio sam CSS Grid:
grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min-width)), 1fr));

Ovim pravilom sam omogućio da se broj kartica u jednom redu automatski prilagođava širini prostora. Kada ima dovoljno mjesta, kartice su jedna pored druge, a kada ga nema, prebacuju se u novi red. Pri tome se vodi računa i o njihovoj minimalnoj širini, tako da kartice ne postanu previše uske. Flexbox bi se mogao koristiti i za raspored kartica, ali sam izabrao Grid jer mi je praktičniji za organizovanje elemenata u redove i kolone.

## 2. CSS specifičnost

U svom CSS kodu nisam koristio !important. Pokušao sam organizovati stilove tako da nema potrebe za njim i da se pravila međusobno ne sukobljavaju. Najčešće koristim klase i selektore HTML elemenata, a stilove sam rasporedio od osnovnih prema konkretnijim. Prvo sam definisao osnovni izgled elemenata, a zatim njihove posebne stilove i stanja, kao što su :hover i :user-invalid. Za tamnu temu koristio sam CSS varijable, tako da sam mogao promijeniti boje na jednom mjestu, bez ponavljanja istih pravila za svaki element. Dodao sam i prefers-reduced-motion: reduce kako bi stranica bila ugodnija za korištenje osobama kojima animacije smetaju. Ako korisnik u postavkama svog sistema uključi smanjenje animacija, stranica neće prikazivati tranzicije na karticama, linkovima i dugmadima, niti će se kartica pomjerati i dobijati sjenku prilikom prelaska mišem. Kao primjer specifičnosti, selektor .checkbox-group input ima veću specifičnost od opšteg selektora input, select. Zbog toga checkbox zadržava svoju posebnu širinu, umjesto da preuzme width: 100% koji je definisan za ostala polja forme.

## 3. Šta bi se desilo kada bih uklonio box-sizing: border-box?

Kada bih iz univerzalnog selektora * uklonio box-sizing: border-box, elementi bi koristili podrazumijevani content-box model. To znači da bi se zadana širina odnosila samo na sadržaj, a padding i border bi se dodavali na nju.

Kod kartica (.dashboard-card) njihovu širinu određuje CSS Grid, tako da samo uklanjanje ovog svojstva ne bi nužno dovelo do toga da kartice izađu iz svojih kolona. Ipak, dodatni padding i border povećali bi ukupne dimenzije elemenata kojima je zadana određena širina. To bi moglo uticati na unutrašnji raspored kartica, posebno kod elemenata koji imaju širinu od 100%. Zbog toga sam koristio box-sizing: border-box. Na taj način su padding i border uključeni u ukupnu širinu elementa, pa je lakše održati pravilan raspored i izbjeći nepotrebno širenje elemenata.





