
const PODRAZUMIJEVANI_FAKTORI = {
    struja: 0.5,
    plin: 2.0,
    voda: 0.001
};

const PODRAZUMIJEVANE_JEDINICE = {
    struja: "kWh",
    plin: "m3",
    voda: "m3"
};

export function Evidencija(tabelaRef, opcije = {}) {

    if (!(tabelaRef instanceof HTMLTableElement)) {
        throw new Error("Neispravna tabela!");
    }

    const tbody = tabelaRef.tBodies[0];

    if (!tbody) {
        throw new Error("Tabela nema tbody element!");
    }

    const faktoriEmisije = {
        ...PODRAZUMIJEVANI_FAKTORI,
        ...(opcije.faktoriEmisije || {})
    };

    const jedinice = {
        ...PODRAZUMIJEVANE_JEDINICE,
        ...(opcije.jedinice || {})
    };

    let mjerenja = [];
    let brojacId = 1;

    function generisiId() {
        let id;

        do {
            id = `mjerenje-${brojacId++}`;
        } while (mjerenja.some(m => m.id === id));

        return id;
    }

    function validanDatum(dan, mjesec, godina) {
        const datum = new Date(godina, mjesec - 1, dan);

        return datum.getFullYear() === godina &&
            datum.getMonth() === mjesec - 1 &&
            datum.getDate() === dan;
    }

    function parsirajDatum(vrijednost) {
        const tekst = vrijednost.trim();

        let rezultat;

        if (/^\d{4}-\d{2}-\d{2}$/.test(tekst)) {
            rezultat = tekst.match(/^(\d{4})-(\d{2})-(\d{2})$/);

            const godina = Number(rezultat[1]);
            const mjesec = Number(rezultat[2]);
            const dan = Number(rezultat[3]);

            if (!validanDatum(dan, mjesec, godina)) {
                return null;
            }

            return new Date(godina, mjesec - 1, dan);
        }

        if (/^\d{2}[./]\d{2}[./]\d{4}$/.test(tekst)) {
            rezultat = tekst.match(/^(\d{2})[./]\(\d{2})[./]\(\d{4})$/);


            const dan = Number(rezultat[1]);
            const mjesec = Number(rezultat[2]);
            const godina = Number(rezultat[3]);

            if (!validanDatum(dan, mjesec, godina)) {
                return null;
            }

            return new Date(godina, mjesec - 1, dan);
        }

        return null;
    }

    function parsirajKolicinu(vrijednost) {
        const tekst = vrijednost
            .replace(/\u00A0/g, " ")
            .trim()
            .replace(",", ".");

        if (!/^\d+(\.\d{1,2})?$/.test(tekst)) {
            return null;
        }

        const broj = Number(tekst);

        if (!Number.isFinite(broj) || broj <= 0) {
            return null;
        }

        return broj;
    }

    function parsirajIncident(celija) {
        const checkbox = celija.querySelector('input[type="checkbox"]');

        if (checkbox) {
            return checkbox.checked;
        }

        const tekst = celija.textContent.trim().toLowerCase();

        return ["da", "yes", "1", "x", "✓"].includes(tekst);
    }

    function pronadjiCeliju(red, naziv) {
        return red.querySelector(`[data-column="${naziv}"]`);
    }

    function formatirajDatum(datum) {
        const dan = String(datum.getDate()).padStart(2, "0");
        const mjesec = String(datum.getMonth() + 1).padStart(2, "0");
        const godina = datum.getFullYear();

        return `${dan}.${mjesec}.${godina}.`;
    }

    function formatirajISOdatum(datum) {
        const godina = datum.getFullYear();
        const mjesec = String(datum.getMonth() + 1).padStart(2, "0");
        const dan = String(datum.getDate()).padStart(2, "0");

        return `${godina}-${mjesec}-${dan}`;
    }

    function kopirajMjerenje(mjerenje) {
        return {
            id: mjerenje.id,
            energent: mjerenje.energent,
            kolicina: mjerenje.kolicina,
            datum: new Date(mjerenje.datum.getTime()),
            incident: mjerenje.incident
        };
    }

    function validirajMjerenje(obj) {
        const greske = [];

        if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
            return {
                uspjesno: false,
                greske: [{
                    polje: "mjerenje",
                    poruka: "Neispravno mjerenje."
                }]
            };
        }

        const energent = typeof obj.energent === "string"
            ? obj.energent.trim().toLowerCase()
            : "";

        if (!["struja", "plin", "voda"].includes(energent)) {
            greske.push({
                polje: "energent",
                poruka: "Odaberite ispravan energent."
            });
        }

        const kolicina = obj.kolicina;

        if (
            typeof kolicina !== "number" ||
            !Number.isFinite(kolicina) ||
            kolicina <= 0 ||
            Math.abs(kolicina * 100 - Math.round(kolicina * 100)) > 0.000001
        ) {
            greske.push({
                polje: "kolicina",
                poruka: "Količina mora biti pozitivan broj sa najviše dvije decimale."
            });
        }

        const datum = obj.datum;
        const trenutnaGodina = new Date().getFullYear();

        if (
            !(datum instanceof Date) ||
            Number.isNaN(datum.getTime()) ||
            datum.getFullYear() !== trenutnaGodina
        ) {
            greske.push({
                polje: "datum",
                poruka: `Datum mora biti validan i unutar ${trenutnaGodina}. godine.`
            });
        }

        if (typeof obj.incident !== "boolean") {
            greske.push({
                polje: "incident",
                poruka: "Incident mora biti true ili false."
            });
        }

        return {
            uspjesno: greske.length === 0,
            greske
        };
    }

    function ucitajMjerenja() {
        Array.from(tbody.rows).forEach(red => {

            const celijaEnergent = pronadjiCeliju(red, "energent");
            const celijaKolicina = pronadjiCeliju(red, "kolicina");
            const celijaDatum = pronadjiCeliju(red, "datum");
            const celijaIncident = pronadjiCeliju(red, "incident");

            if (
                !celijaEnergent ||
                !celijaKolicina ||
                !celijaDatum ||
                !celijaIncident
            ) {
                return;
            }

            const energent = celijaEnergent.textContent
                .trim()
                .toLowerCase();

            const kolicina = parsirajKolicinu(
                celijaKolicina.textContent
            );

            const datum = parsirajDatum(
                celijaDatum.textContent
            );

            const incident = parsirajIncident(celijaIncident);

            if (
                !["struja", "plin", "voda"].includes(energent) ||
                kolicina === null ||
                datum === null
            ) {
                return;
            }

            let id = red.dataset.id;

            if (
                !id ||
                mjerenja.some(m => m.id === id)
            ) {
                id = generisiId();
            }

            red.dataset.id = id;

            mjerenja.push({
                id,
                energent,
                kolicina,
                datum,
                incident
            });
        });
    }

    function azurirajPrikaz(red, mjerenje) {
        const celije = red.querySelectorAll("[data-column]");

        celije.forEach(celija => {
            switch (celija.dataset.column) {
                case "datum":
                    celija.textContent = formatirajDatum(mjerenje.datum);
                    break;

                case "energent":
                    celija.textContent = mjerenje.energent;
                    break;

                case "kolicina":
                    celija.textContent = String(mjerenje.kolicina);
                    break;

                case "jedinica":
                    celija.textContent = jedinice[mjerenje.energent];
                    break;

                case "emisija":
                    celija.textContent =
                        `${(mjerenje.kolicina *
                            faktoriEmisije[mjerenje.energent]).toFixed(2)} kg`;
                    break;

                case "incident":
                    celija.textContent = mjerenje.incident ? "Da" : "Ne";
                    break;
            }
        });
    }

    function kreirajRed(mjerenje) {
        const red = document.createElement("tr");

        red.dataset.id = mjerenje.id;

        const zaglavlja = tabelaRef.querySelectorAll(
            "thead [data-column]"
        );

        zaglavlja.forEach(zaglavlje => {
            const celija = document.createElement("td");

            celija.dataset.column = zaglavlje.dataset.column;

            red.appendChild(celija);
        });

        azurirajPrikaz(red, mjerenje);

        return red;
    }

    ucitajMjerenja();

    function dajMjerenja(filter = {}) {
        return mjerenja
            .filter(m => {
                if (
                    filter.energent !== undefined &&
                    m.energent !== String(filter.energent).trim().toLowerCase()
                ) {
                    return false;
                }

                if (
                    filter.odDatuma !== undefined &&
                    m.datum < filter.odDatuma
                ) {
                    return false;
                }

                if (
                    filter.doDatuma !== undefined &&
                    m.datum > filter.doDatuma
                ) {
                    return false;
                }

                if (
                    filter.samoIncidenti === true &&
                    !m.incident
                ) {
                    return false;
                }

                return true;
            })
            .map(kopirajMjerenje);
    }

    function dodajMjerenje(obj) {
        const rezultat = validirajMjerenje(obj);

        if (!rezultat.uspjesno) {
            return rezultat;
        }

        const novoMjerenje = {
            id: generisiId(),
            energent: obj.energent.trim().toLowerCase(),
            kolicina: obj.kolicina,
            datum: new Date(obj.datum.getTime()),
            incident: obj.incident
        };

        const noviRed = kreirajRed(novoMjerenje);

        tbody.appendChild(noviRed);
        mjerenja.push(novoMjerenje);

        return {
            uspjesno: true,
            greske: []
        };
    }

    function ukloniMjerenje(id) {
        const indeks = mjerenja.findIndex(m => m.id === id);

        if (indeks === -1) {
            return false;
        }

        const red = Array.from(tbody.rows).find(
            r => r.dataset.id === id
        );

        if (!red) {
            return false;
        }

        red.remove();
        mjerenja.splice(indeks, 1);

        return true;
    }

    function azurirajMjerenje(id, izmjene) {
        const postojece = mjerenja.find(m => m.id === id);

        if (!postojece) {
            return {
                uspjesno: false,
                greske: [{
                    polje: "id",
                    poruka: "Mjerenje ne postoji."
                }]
            };
        }

        if (
            !izmjene ||
            typeof izmjene !== "object" ||
            Array.isArray(izmjene)
        ) {
            return {
                uspjesno: false,
                greske: [{
                    polje: "izmjene",
                    poruka: "Neispravne izmjene."
                }]
            };
        }

        const azurirano = {
            energent: postojece.energent,
            kolicina: postojece.kolicina,
            datum: postojece.datum,
            incident: postojece.incident,
            ...izmjene
        };

        const rezultat = validirajMjerenje(azurirano);

        if (!rezultat.uspjesno) {
            return rezultat;
        }

        const novoMjerenje = {
            id: postojece.id,
            energent: azurirano.energent.trim().toLowerCase(),
            kolicina: azurirano.kolicina,
            datum: new Date(azurirano.datum.getTime()),
            incident: azurirano.incident
        };

        const red = Array.from(tbody.rows).find(
            r => r.dataset.id === id
        );

        if (!red) {
            return {
                uspjesno: false,
                greske: [{
                    polje: "id",
                    poruka: "Red mjerenja nije pronađen u tabeli."
                }]
            };
        }

        azurirajPrikaz(red, novoMjerenje);

        const indeks = mjerenja.findIndex(m => m.id === id);
        mjerenja[indeks] = novoMjerenje;

        return {
            uspjesno: true,
            greske: []
        };
    }

    function brojMjerenja() {
        return mjerenja.length;
    }


    function zaokruziNaDvijeDecimale(broj) {
        return Math.round((broj + Number.EPSILON) * 100) / 100;
    }

    function dajUkupnuEmisiju(filter = {}) {
        const filtriranaMjerenja = dajMjerenja(filter);

        const ukupnaEmisija = filtriranaMjerenja.reduce((ukupno, mjerenje) => {
            const faktor = faktoriEmisije[mjerenje.energent] || 0;

            return ukupno + mjerenje.kolicina * faktor;
        }, 0);

        return zaokruziNaDvijeDecimale(ukupnaEmisija);
    }

    function dajStatistikuPoEnergentu() {
        const statistika = {};

        mjerenja.forEach(mjerenje => {
            const energent = mjerenje.energent;

            if (!statistika[energent]) {
                statistika[energent] = {
                    broj: 0,
                    ukupno: 0,
                    prosjek: 0,
                    min: mjerenje.kolicina,
                    max: mjerenje.kolicina
                };
            }

            const podaci = statistika[energent];

            podaci.broj++;
            podaci.ukupno += mjerenje.kolicina;
            podaci.min = Math.min(podaci.min, mjerenje.kolicina);
            podaci.max = Math.max(podaci.max, mjerenje.kolicina);
        });

        Object.values(statistika).forEach(podaci => {
            const ukupno = podaci.ukupno;

            podaci.prosjek = zaokruziNaDvijeDecimale(
                ukupno / podaci.broj
            );

            podaci.ukupno = zaokruziNaDvijeDecimale(ukupno);
        });

        return statistika;
    }

    function prosjecnaPotrosnja(energent, period) {
        const danas = new Date();

        let pocetakPerioda = new Date(
            danas.getFullYear(),
            danas.getMonth(),
            danas.getDate()
        );

        if (period === "sedmica") {
            const danUSedmici = (pocetakPerioda.getDay() + 6) % 7;
            pocetakPerioda.setDate(
                pocetakPerioda.getDate() - danUSedmici
            );
        } else if (period === "mjesec") {
            pocetakPerioda = new Date(
                danas.getFullYear(),
                danas.getMonth(),
                1
            );
        } else if (period === "godina") {
            pocetakPerioda = new Date(
                danas.getFullYear(),
                0,
                1
            );
        } else {
            return 0;
        }

        const filtriranaMjerenja = mjerenja.filter(mjerenje => {
            return (
                mjerenje.energent === String(energent).toLowerCase() &&
                mjerenje.datum >= pocetakPerioda &&
                mjerenje.datum <= danas
            );
        });

        if (filtriranaMjerenja.length === 0) {
            return 0;
        }

        const ukupno = filtriranaMjerenja.reduce(
            (suma, mjerenje) => suma + mjerenje.kolicina,
            0
        );

        return zaokruziNaDvijeDecimale(
            ukupno / filtriranaMjerenja.length
        );
    }

    function detektujAnomalije() {
        const statistika = dajStatistikuPoEnergentu();
        const anomalije = [];

        mjerenja.forEach(mjerenje => {
            let razlog = null;

            if (mjerenje.incident === true) {
                razlog = "incident";
            } else if (
                statistika[mjerenje.energent] &&
                mjerenje.kolicina >
                3 * statistika[mjerenje.energent].prosjek
            ) {
                razlog = "visoka_potrosnja";
            } else if (mjerenje.kolicina < 0) {
                razlog = "negativna_potrosnja";
            }

            if (razlog !== null) {
                anomalije.push({
                    id: mjerenje.id,
                    razlog: razlog
                });
            }
        });

        return anomalije;
    }

    function escapujCSV(vrijednost) {
        const tekst = String(vrijednost);

        if (/[",\r\n]/.test(tekst)) {
            return '"' + tekst.replace(/"/g, '""') + '"';
        }

        return tekst;
    }

    function generisiIzvjestaj(format) {
        const podaci = dajMjerenja();

        if (format === "json") {
            return JSON.stringify(podaci);
        }

        if (format === "csv") {
            const zaglavlje = [
                "id",
                "energent",
                "kolicina",
                "datum",
                "incident"
            ];

            const redovi = podaci.map(mjerenje => [
                mjerenje.id,
                mjerenje.energent,
                mjerenje.kolicina,
                formatirajISOdatum(mjerenje.datum),
                mjerenje.incident
            ]);

            return [
                zaglavlje.map(escapujCSV).join(","),
                ...redovi.map(red => red.map(escapujCSV).join(","))
            ].join("\r\n");
        }

        return "";
    }

    function sortirajMjerenja(kljuc, smjer = "asc") {
        const dozvoljeniKljuc = [
            "energent",
            "kolicina",
            "datum",
            "incident"
        ];

        if (
            !dozvoljeniKljuc.includes(kljuc) ||
            !["asc", "desc"].includes(smjer)
        ) {
            return [];
        }

        const kopije = dajMjerenja();

        return kopije
            .map((mjerenje, indeks) => ({
                mjerenje,
                indeks
            }))
            .sort((a, b) => {
                let vrijednostA = a.mjerenje[kljuc];
                let vrijednostB = b.mjerenje[kljuc];

                if (vrijednostA instanceof Date) {
                    vrijednostA = vrijednostA.getTime();
                    vrijednostB = vrijednostB.getTime();
                }

                if (vrijednostA < vrijednostB) {
                    return smjer === "asc" ? -1 : 1;
                }

                if (vrijednostA > vrijednostB) {
                    return smjer === "asc" ? 1 : -1;
                }

                return a.indeks - b.indeks;
            })
            .map(stavka => stavka.mjerenje);
    }

    function grupisiPoDanu() {
        const grupe = {};

        mjerenja.forEach(mjerenje => {
            const datum = formatirajISOdatum(mjerenje.datum);

            if (!grupe[datum]) {
                grupe[datum] = [];
            }

            grupe[datum].push(kopirajMjerenje(mjerenje));
        });

        const sortiraniDatumi = Object.keys(grupe).sort();

        const rezultat = {};

        sortiraniDatumi.forEach(datum => {
            rezultat[datum] = grupe[datum];
        });

        return rezultat;
    }


    return {
        dajMjerenja,
        dodajMjerenje,
        ukloniMjerenje,
        azurirajMjerenje,
        brojMjerenja,

        dajUkupnuEmisiju,
        dajStatistikuPoEnergentu,
        prosjecnaPotrosnja,
        detektujAnomalije,
        generisiIzvjestaj,
        sortirajMjerenja,
        grupisiPoDanu
    };
}

export default Evidencija;
