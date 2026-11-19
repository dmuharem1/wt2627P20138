const Evidencija = (function () {
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

    const PODRAZUMIJEVANE_KOLONE = ["energent", "kolicina", "datum", "incident"];

    return function Evidencija(tabelaRef, opcije = {}) {
        if (!(tabelaRef instanceof HTMLTableElement)) {
            throw new Error("Neispravna tabela!");
        }

        const tbody = tabelaRef.tBodies[0] || tabelaRef.createTBody();

        const faktoriEmisije = {
            ...PODRAZUMIJEVANI_FAKTORI,
            ...((opcije && opcije.faktoriEmisije) || {})
        };

        const jedinice = {
            ...PODRAZUMIJEVANE_JEDINICE,
            ...((opcije && opcije.jedinice) || {})
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

        function normalizujNazivKolone(tekst) {
            const cisto = String(tekst || "")
                .replace(/\u00A0/g, " ")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (cisto.includes("energent")) return "energent";
            if (cisto.includes("kolicina") || cisto.includes("potrosnja")) return "kolicina";
            if (cisto.includes("datum")) return "datum";
            if (cisto.includes("incident")) return "incident";
            if (cisto.includes("jedinica")) return "jedinica";
            if (cisto.includes("emisija")) return "emisija";
            if (cisto.includes("akcij")) return "akcije";

            return cisto;
        }

        function odrediRasporedKolona() {
            const theadRed = tabelaRef.tHead && tabelaRef.tHead.rows[0];
            if (!theadRed) {
                return [...PODRAZUMIJEVANE_KOLONE];
            }

            const celijeZaglavlja = Array.from(theadRed.cells);
            if (celijeZaglavlja.length === 0) {
                return [...PODRAZUMIJEVANE_KOLONE];
            }

            return celijeZaglavlja.map((th, indeks) => {
                if (th.dataset && th.dataset.column) {
                    return th.dataset.column;
                }
                const prepoznato = normalizujNazivKolone(th.textContent);
                return prepoznato || PODRAZUMIJEVANE_KOLONE[indeks] || `kolona-${indeks}`;
            });
        }

        function validanDatum(dan, mjesec, godina) {
            const datum = new Date(godina, mjesec - 1, dan);

            return (
                datum.getFullYear() === godina &&
                datum.getMonth() === mjesec - 1 &&
                datum.getDate() === dan
            );
        }

        function parsirajDatum(vrijednost) {
            const tekst = String(vrijednost || "")
                .replace(/\u00A0/g, " ")
                .trim();

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

            if (/^\d{2}[./]\d{2}[./]\d{4}\.?$/.test(tekst)) {
                rezultat = tekst.match(/^(\d{2})[./](\d{2})[./](\d{4})\.?$/);
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
            const tekst = String(vrijednost || "")
                .replace(/&nbsp;/gi, " ")
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

            const tekst = celija.textContent
                .replace(/\u00A0/g, " ")
                .trim()
                .toLowerCase();

            return ["da", "yes", "1", "x", "✓"].includes(tekst);
        }

        function pronadjiCeliju(red, naziv, rasporedKolona) {
            const poAtributu = red.querySelector(`[data-column="${naziv}"]`);
            if (poAtributu) {
                return poAtributu;
            }

            const indeks = rasporedKolona.indexOf(naziv);
            if (indeks !== -1 && red.cells[indeks]) {
                return red.cells[indeks];
            }

            return null;
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
            const rasporedKolona = odrediRasporedKolona();

            Array.from(tbody.rows).forEach(red => {
                const celijaEnergent = pronadjiCeliju(red, "energent", rasporedKolona);
                const celijaKolicina = pronadjiCeliju(red, "kolicina", rasporedKolona);
                const celijaDatum = pronadjiCeliju(red, "datum", rasporedKolona);
                const celijaIncident = pronadjiCeliju(red, "incident", rasporedKolona);

                if (
                    !celijaEnergent ||
                    !celijaKolicina ||
                    !celijaDatum ||
                    !celijaIncident
                ) {
                    return;
                }

                const energent = celijaEnergent.textContent
                    .replace(/\u00A0/g, " ")
                    .trim()
                    .toLowerCase();

                const kolicina = parsirajKolicinu(celijaKolicina.textContent);
                const datum = parsirajDatum(celijaDatum.textContent);
                const incident = parsirajIncident(celijaIncident);

                if (
                    !["struja", "plin", "voda"].includes(energent) ||
                    kolicina === null ||
                    datum === null
                ) {
                    return;
                }

                let id = red.dataset.id;

                if (!id || mjerenja.some(m => m.id === id)) {
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

        function popuniCeliju(celija, kolona, mjerenje) {
            switch (kolona) {
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
                        `${(mjerenje.kolicina * (faktoriEmisije[mjerenje.energent] ?? 0)).toFixed(2)} kg`;
                    break;

                case "incident":
                    celija.textContent = mjerenje.incident ? "Da" : "Ne";
                    break;
            }
        }

        function azurirajPrikaz(red, mjerenje) {
            const rasporedKolona = odrediRasporedKolona();
            const celije = Array.from(red.cells);

            celije.forEach((celija, indeks) => {
                const kolona = celija.dataset.column || rasporedKolona[indeks];
                if (kolona) {
                    popuniCeliju(celija, kolona, mjerenje);
                }
            });
        }

        function kreirajRed(mjerenje) {
            const red = document.createElement("tr");
            red.dataset.id = mjerenje.id;

            const rasporedKolona = odrediRasporedKolona();

            rasporedKolona.forEach(kolona => {
                const celija = document.createElement("td");
                celija.dataset.column = kolona;
                popuniCeliju(celija, kolona, mjerenje);
                red.appendChild(celija);
            });

            return red;
        }

        ucitajMjerenja();

        function dajMjerenja(filter = {}) {
            const f = filter || {};

            return mjerenja
                .filter(m => {
                    if (
                        f.energent !== undefined &&
                        m.energent !== String(f.energent).trim().toLowerCase()
                    ) {
                        return false;
                    }

                    if (f.odDatuma instanceof Date && !Number.isNaN(f.odDatuma.getTime())) {
                        if (m.datum < f.odDatuma) {
                            return false;
                        }
                    }

                    if (f.doDatuma instanceof Date && !Number.isNaN(f.doDatuma.getTime())) {
                        const granicaDo = new Date(f.doDatuma.getTime());
                        if (
                            granicaDo.getHours() === 0 &&
                            granicaDo.getMinutes() === 0 &&
                            granicaDo.getSeconds() === 0 &&
                            granicaDo.getMilliseconds() === 0
                        ) {
                            granicaDo.setHours(23, 59, 59, 999);
                        }
                        if (m.datum > granicaDo) {
                            return false;
                        }
                    }

                    if (f.samoIncidenti === true && !m.incident) {
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

            const red = Array.from(tbody.rows).find(r => r.dataset.id === id);

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

            if (!izmjene || typeof izmjene !== "object" || Array.isArray(izmjene)) {
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

            const red = Array.from(tbody.rows).find(r => r.dataset.id === id);

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
                const faktor = faktoriEmisije[mjerenje.energent] ?? 0;
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
                podaci.prosjek = zaokruziNaDvijeDecimale(ukupno / podaci.broj);
                podaci.ukupno = zaokruziNaDvijeDecimale(ukupno);
            });

            return statistika;
        }

        function prosjecnaPotrosnja(energent, period) {
            const danas = new Date();
            let pocetakPerioda;
            let krajPerioda;

            if (period === "sedmica") {
                pocetakPerioda = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate());
                const danUSedmici = (pocetakPerioda.getDay() + 6) % 7;
                pocetakPerioda.setDate(pocetakPerioda.getDate() - danUSedmici);

                krajPerioda = new Date(
                    pocetakPerioda.getFullYear(),
                    pocetakPerioda.getMonth(),
                    pocetakPerioda.getDate() + 6,
                    23, 59, 59, 999
                );
            } else if (period === "mjesec") {
                pocetakPerioda = new Date(danas.getFullYear(), danas.getMonth(), 1, 0, 0, 0, 0);
                krajPerioda = new Date(danas.getFullYear(), danas.getMonth() + 1, 0, 23, 59, 59, 999);
            } else if (period === "godina") {
                pocetakPerioda = new Date(danas.getFullYear(), 0, 1, 0, 0, 0, 0);
                krajPerioda = new Date(danas.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                return 0;
            }

            const trazeniEnergent = String(energent || "").trim().toLowerCase();

            const filtriranaMjerenja = mjerenja.filter(mjerenje => {
                return (
                    mjerenje.energent === trazeniEnergent &&
                    mjerenje.datum >= pocetakPerioda &&
                    mjerenje.datum <= krajPerioda
                );
            });

            if (filtriranaMjerenja.length === 0) {
                return 0;
            }

            const ukupno = filtriranaMjerenja.reduce(
                (suma, mjerenje) => suma + mjerenje.kolicina,
                0
            );

            return zaokruziNaDvijeDecimale(ukupno / filtriranaMjerenja.length);
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
                    mjerenje.kolicina > 3 * statistika[mjerenje.energent].prosjek
                ) {
                    razlog = "visoka_potrosnja";
                } else if (mjerenje.kolicina < 0) {
                    razlog = "negativna_potrosnja";
                }

                if (razlog !== null) {
                    anomalije.push({
                        id: mjerenje.id,
                        razlog
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
            const dozvoljeniKljuc = ["energent", "kolicina", "datum", "incident"];

            if (
                !dozvoljeniKljuc.includes(kljuc) ||
                !["asc", "desc"].includes(smjer)
            ) {
                return [];
            }

            const kopije = dajMjerenja();

            return kopije
                .map((mjerenje, indeks) => ({ mjerenje, indeks }))
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

        // Zadatak 4: Dodatne metode

        function prognozirajPotrosnju(energent, brojDana) {
            if (!Number.isInteger(brojDana) || brojDana <= 0) {
                return [];
            }

            const trazeniEnergent = String(energent || "").trim().toLowerCase();
            const danas = new Date();
            const krajProzora = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate(), 23, 59, 59, 999);
            const pocetakProzora = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate() - 30, 0, 0, 0, 0);

            const relevantna = mjerenja
                .filter(m =>
                    m.energent === trazeniEnergent &&
                    m.datum >= pocetakProzora &&
                    m.datum <= krajProzora
                )
                .sort((a, b) => a.datum.getTime() - b.datum.getTime());

            if (relevantna.length < 2) {
                return [];
            }

            const msPoDanu = 24 * 60 * 60 * 1000;
            const baznoVrijeme = new Date(
                relevantna[0].datum.getFullYear(),
                relevantna[0].datum.getMonth(),
                relevantna[0].datum.getDate()
            ).getTime();

            const tacke = relevantna.map(m => {
                const danVrijeme = new Date(
                    m.datum.getFullYear(),
                    m.datum.getMonth(),
                    m.datum.getDate()
                ).getTime();
                return {
                    x: (danVrijeme - baznoVrijeme) / msPoDanu,
                    y: m.kolicina
                };
            });

            const n = tacke.length;
            const prosjekX = tacke.reduce((s, t) => s + t.x, 0) / n;
            const prosjekY = tacke.reduce((s, t) => s + t.y, 0) / n;

            let brojnik = 0;
            let nazivnik = 0;

            tacke.forEach(t => {
                brojnik += (t.x - prosjekX) * (t.y - prosjekY);
                nazivnik += (t.x - prosjekX) ** 2;
            });

            const nagib = nazivnik === 0 ? 0 : brojnik / nazivnik;
            const odsjecak = prosjekY - nagib * prosjekX;

            const prognoza = [];
            for (let i = 1; i <= brojDana; i++) {
                const ciljniDatum = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate() + i);
                const xCilj = (ciljniDatum.getTime() - baznoVrijeme) / msPoDanu;
                const predvidjenaKolicina = Math.max(0, zaokruziNaDvijeDecimale(odsjecak + nagib * xCilj));

                prognoza.push({
                    datum: ciljniDatum,
                    kolicina: predvidjenaKolicina
                });
            }

            return prognoza;
        }

        function detektujSezonalnost(energent) {
            const trazeniEnergent = String(energent || "").trim().toLowerCase();
            const filtrirana = mjerenja.filter(m => m.energent === trazeniEnergent);

            if (filtrirana.length === 0) {
                return null;
            }

            const poMjesecima = {};

            filtrirana.forEach(m => {
                const mjesec = m.datum.getMonth() + 1;
                if (!poMjesecima[mjesec]) {
                    poMjesecima[mjesec] = { suma: 0, broj: 0 };
                }
                poMjesecima[mjesec].suma += m.kolicina;
                poMjesecima[mjesec].broj++;
            });

            let najboljiMjesec = null;
            let najveciProsjek = -Infinity;

            Object.entries(poMjesecima).forEach(([mjesecStr, podaci]) => {
                const prosjek = zaokruziNaDvijeDecimale(podaci.suma / podaci.broj);
                if (prosjek > najveciProsjek) {
                    najveciProsjek = prosjek;
                    najboljiMjesec = Number(mjesecStr);
                }
            });

            return {
                mjesec: najboljiMjesec,
                prosjek: najveciProsjek
            };
        }

        function izveziKaoCSV() {
            try {
                const csvSadrzaj = generisiIzvjestaj("csv");
                const blob = new Blob([csvSadrzaj], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = "ecotrack-izvjestaj.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();

                URL.revokeObjectURL(url);
                return true;
            } catch {
                return false;
            }
        }

        function parsirajCSVRedove(tekst) {
            const redovi = [];
            let trenutniRed = [];
            let trenutnoPolje = "";
            let unutarNavodnika = false;

            for (let i = 0; i < tekst.length; i++) {
                const znak = tekst[i];
                const sljedeci = tekst[i + 1];

                if (unutarNavodnika) {
                    if (znak === '"' && sljedeci === '"') {
                        trenutnoPolje += '"';
                        i++;
                    } else if (znak === '"') {
                        unutarNavodnika = false;
                    } else {
                        trenutnoPolje += znak;
                    }
                } else {
                    if (znak === '"') {
                        unutarNavodnika = true;
                    } else if (znak === ",") {
                        trenutniRed.push(trenutnoPolje);
                        trenutnoPolje = "";
                    } else if (znak === "\r" && sljedeci === "\n") {
                        trenutniRed.push(trenutnoPolje);
                        redovi.push(trenutniRed);
                        trenutniRed = [];
                        trenutnoPolje = "";
                        i++;
                    } else if (znak === "\n" || znak === "\r") {
                        trenutniRed.push(trenutnoPolje);
                        redovi.push(trenutniRed);
                        trenutniRed = [];
                        trenutnoPolje = "";
                    } else {
                        trenutnoPolje += znak;
                    }
                }
            }

            if (unutarNavodnika) {
                return null;
            }

            if (trenutnoPolje.length > 0 || trenutniRed.length > 0) {
                trenutniRed.push(trenutnoPolje);
                redovi.push(trenutniRed);
            }

            return redovi.filter(r => !(r.length === 1 && r[0].trim() === ""));
        }

        function ucitajIzCSV(tekst) {
            if (typeof tekst !== "string" || tekst.trim() === "") {
                return {
                    uspjesno: false,
                    greske: [{ red: 1, poruka: "CSV sadržaj je prazan." }]
                };
            }

            const redovi = parsirajCSVRedove(tekst);

            if (!redovi || redovi.length === 0) {
                return {
                    uspjesno: false,
                    greske: [{ red: 1, poruka: "Neispravan CSV format." }]
                };
            }

            let pocetniIndeks = 0;
            let indeksKolone = {
                energent: 0,
                kolicina: 1,
                datum: 2,
                incident: 3
            };

            const prviRed = redovi[0].map(c => c.trim().toLowerCase());
            if (prviRed.includes("energent") && prviRed.includes("kolicina")) {
                pocetniIndeks = 1;
                indeksKolone = {
                    energent: prviRed.indexOf("energent"),
                    kolicina: prviRed.indexOf("kolicina"),
                    datum: prviRed.indexOf("datum"),
                    incident: prviRed.indexOf("incident")
                };
            }

            const podaciRedovi = redovi.slice(pocetniIndeks);
            if (podaciRedovi.length === 0) {
                return {
                    uspjesno: false,
                    greske: [{ red: 1, poruka: "CSV ne sadrži podatke." }]
                };
            }

            const validiranaMjerenja = [];
            const greske = [];

            podaciRedovi.forEach((kolone, idx) => {
                const brojReda = idx + 1;

                if (
                    indeksKolone.energent === -1 ||
                    indeksKolone.kolicina === -1 ||
                    indeksKolone.datum === -1 ||
                    indeksKolone.incident === -1 ||
                    kolone.length <= Math.max(
                        indeksKolone.energent,
                        indeksKolone.kolicina,
                        indeksKolone.datum,
                        indeksKolone.incident
                    )
                ) {
                    greske.push({
                        red: brojReda,
                        poruka: "Nedostaju obavezne kolone u CSV redu."
                    });
                    return;
                }

                const energent = String(kolone[indeksKolone.energent] || "").trim().toLowerCase();
                const kolicina = parsirajKolicinu(kolone[indeksKolone.kolicina]);
                const datum = parsirajDatum(kolone[indeksKolone.datum]);

                const incidentTekst = String(kolone[indeksKolone.incident] || "").trim().toLowerCase();
                let incident = null;
                if (["true", "da", "yes", "1", "x", "✓"].includes(incidentTekst)) {
                    incident = true;
                } else if (["false", "ne", "no", "0", ""].includes(incidentTekst)) {
                    incident = false;
                }

                const kandidat = {
                    energent,
                    kolicina,
                    datum,
                    incident
                };

                const provjera = validirajMjerenje(kandidat);
                if (!provjera.uspjesno) {
                    provjera.greske.forEach(g => {
                        greske.push({
                            red: brojReda,
                            poruka: g.poruka
                        });
                    });
                } else {
                    validiranaMjerenja.push(kandidat);
                }
            });

            if (greske.length > 0) {
                return {
                    uspjesno: false,
                    greske
                };
            }

            validiranaMjerenja.forEach(m => {
                dodajMjerenje(m);
            });

            return {
                uspjesno: true,
                greske: []
            };
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
            grupisiPoDanu,

            prognozirajPotrosnju,
            detektujSezonalnost,
            izveziKaoCSV,
            ucitajIzCSV
        };
    };
})();

if (typeof window !== "undefined") {
    window.Evidencija = Evidencija;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = Evidencija;
}