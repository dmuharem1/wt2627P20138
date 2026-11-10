# ODLUKE

## 1. Flexbox ili Grid

### Flexbox: .app-layout (radni prostor i sidebar)

Za raspored radnog prostora i sidebara koristio sam Flexbox jer se radi o dva glavna bloka koja trebaju biti jedan pored drugog. Radni prostor zauzima većinu dostupne širine (flex: 999 1 400px), dok sidebar zauzima manje prostora (flex: 1 1 var(--sidebar-width)). Pomoću flex-wrap: wrap elementi se automatski prebacuju u novi red kada nema dovoljno mjesta, bez potrebe za dodatnim @media upitima.

Grid bi se također mogao koristiti, ali bi za ovaj raspored zahtijevao definisanje kolona i dodatno prilagođavanje njihovog rasporeda na manjim ekranima. Flexbox je ovdje jednostavnije rješenje jer se radi o rasporedu elemenata u jednom pravcu.

### Grid: .dashboard-cards (kartice na kontrolnoj tabli)

Za raspored tri kartice koristio sam CSS Grid:
grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min-width)), 1fr));

Ovim pravilom preglednik sam određuje koliko kartica može stati u jedan red, vodeći računa o njihovoj minimalnoj širini. Kartice su ravnomjerno raspoređene, a broj kolona se automatski prilagođava dostupnom prostoru, bez dodatnih @media upita. Flexbox bi se mogao koristiti i za kartice, ali bi bilo teže održati jednaku širinu elemenata u različitim redovima. Grid je pogodniji jer omogućava da kartice budu poravnate u pravilne redove i kolone.

## 2. CSS specifičnost

U CSS-u nisam koristio !important. Trudio sam se da pravila budu jednostavna i da izbjegnem nepotrebno nadjačavanje stilova.

Uglavnom koristim selektore klasa i HTML elemenata, bez ID selektora i inline stilova. CSS pravila su organizovana od općih prema konkretnijim: prvo osnovni stilovi elemenata, zatim stilovi pojedinačnih komponenti, a na kraju njihova stanja poput :hover i :user-invalid. Tamna tema je riješena pomoću CSS varijabli, tako da nije potrebno ponavljati i mijenjati selektore za svaki element. Pravila za prefers-reduced-motion nalaze se nakon osnovnih pravila za animacije. Zbog istog nivoa specifičnosti, ona imaju prednost i isključuju animacije kada korisnik to zatraži u postavkama sistema.

## 3. Šta bi se desilo kada bih uklonio box-sizing: border-box?

Kada bih iz univerzalnog selektora * uklonio box-sizing: border-box, elementi bi koristili podrazumijevani content-box. To znači da bi se zadana širina odnosila samo na sadržaj, dok bi se padding i border dodavali na tu širinu.

To bi moglo izazvati nekoliko problema u postojećem rasporedu:
- Polja forme: input i select imaju width: 100%, ali i dodatni padding i border. Bez border-box modela bila bi šira od svog kontejnera.
- Tabela: .table-container također ima width: 100% i border, pa bi njegova ukupna širina bila nešto veća od širine roditeljskog elementa.
- Sidebar: njegov padding i border dodavali bi se na širinu određenu pomoću flex-basis, zbog čega bi zauzimao više prostora nego što je planirano.
- Kartice: trenutno nemaju eksplicitno zadanu širinu, pa bi uglavnom ostale unutar svojih Grid kolona. Međutim, problem bi se pojavio kada bi im se zadala širina od 100% uz dodatni padding i border.

Na manjim ekranima ovi problemi mogli bi dovesti do horizontalnog pomjeranja stranice i narušavanja rasporeda elemenata. Zbog toga koristim box-sizing: border-box, jer omogućava da ukupna širina elementa uključuje i sadržaj, padding i border. Tako je lakše kontrolisati dimenzije elemenata i održati raspored stranice.
