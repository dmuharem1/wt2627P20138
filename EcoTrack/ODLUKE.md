# ODLUKE – EcoTrack

## 1. Flexbox ili Grid

U projektu sam koristio Flexbox za raspored elemenata u zaglavlju aplikacije (.app-header). Flexbox je pogodan jer se elementi zaglavlja raspoređuju u jednom pravcu, a pomoću svojstava justify-content i align-items jednostavno se kontroliše njihov međusobni položaj.

CSS Grid sam koristio za raspored dashboard kartica (.dashboard-cards). Grid je pogodniji jer omogućava raspored u više kolona i automatsko prilagođavanje njihovog broja pomoću auto-fit i minmax. Korištenje Flexboxa za kartice zahtijevalo bi dodatno podešavanje širina i prelamanja, dok Grid ovo rješava jednostavnije i preglednije.

## 2. CSS specifičnost

U projektu nisam koristio !important. Sukobe prioriteta izbjegao sam organizacijom selektora i korištenjem klasa za pojedinačne komponente. Za različita stanja elemenata koristio sam odgovarajuće pseudo-klase, kao što su :hover, :focus-visible, :user-valid i :user-invalid. Time sam zadržao pregledan CSS kod bez nepotrebnog povećavanja specifičnosti selektora.

## 3. Simulacija box modela

U projektu sam koristio box-sizing: border-box unutar univerzalnog selektora *. Kada bi se ovo svojstvo uklonilo, elementi bi koristili podrazumijevani content-box model. To znači da bi se padding i border dodavali na deklarisanu širinu elemenata.

Konkretno, kartice bi mogle zauzimati više prostora nego što je predviđeno njihovom definisanom širinom, što bi moglo narušiti raspored unutar CSS Grid kontejnera. Korištenjem border-box modela ukupna širina elementa uključuje sadržaj, padding i border, čime se olakšava kontrola dimenzija i održavanje rasporeda.

