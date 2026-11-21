(function () {
    const tabela = document.querySelector('table[data-testid="tabela"]');
    const tbody = tabela.querySelector("tbody");

    const forma = document.querySelector('[data-testid="forma"]');
    const poruke = document.querySelector('[data-testid="poruke"]');

    const karticaEmisija = document.querySelector('[data-testid="kartica-emisija"]');
    const karticaUsteda = document.querySelector('[data-testid="kartica-usteda"]');
    const karticaStatus = document.querySelector('[data-testid="kartica-status"]');
    const dugmeIzveziCsv = document.querySelector("#izvezi-csv");

    const tekucaGodina = new Date().getFullYear();
    const poljeDatum = forma.elements["datum"] || forma.querySelector('input[type="date"]');
    if (poljeDatum) {
        poljeDatum.min = `${tekucaGodina}-01-01`;
        poljeDatum.max = `${tekucaGodina}-12-31`;
    }

    const evidencija = Evidencija(tabela);

    function formatirajBroj(broj) {
        return broj.toFixed(2).replace(".", ",");
    }

    function azurirajKartice() {
        const ukupnaEmisija = evidencija.dajUkupnuEmisiju();
        const usteda = ukupnaEmisija * 0.20;
        const mjerenja = evidencija.dajMjerenja();

        const postojiIncident = mjerenja.some(
            mjerenje => mjerenje.incident === true
        );

        karticaEmisija.textContent = `${formatirajBroj(ukupnaEmisija)} kg`;
        karticaUsteda.textContent = `${formatirajBroj(usteda)} kg`;
        karticaStatus.textContent = postojiIncident ? "Kritično" : "Normalno";
    }

    function dodajDugmeZaBrisanje(red) {
        const celija = red.querySelector('[data-column="akcije"]');

        if (!celija) {
            return;
        }

        const dugme = document.createElement("button");

        dugme.type = "button";
        dugme.className = "delete-button";
        dugme.textContent = "Obriši";
        dugme.dataset.akcija = "obrisi";
        dugme.setAttribute("aria-label", `Obriši mjerenje ${red.dataset.id}`);

        celija.appendChild(dugme);
    }

    Array.from(tbody.rows).forEach(red => {
        if (red.dataset.id) {
            dodajDugmeZaBrisanje(red);
        }
    });

    azurirajKartice();

    let slanjeUtoku = false;

    forma.addEventListener("submit", function (event) {
        event.preventDefault();

        if (slanjeUtoku) {
            return;
        }

        const energent = forma.elements["energent"].value;
        const kolicinaVrijednost = forma.elements["kolicina"].value.trim();
        const kolicina = kolicinaVrijednost === "" ? NaN : Number(kolicinaVrijednost);

        const vrijednostDatuma = forma.elements["datum"].value;
        let datum = new Date(NaN);

        if (/^\d{4}-\d{2}-\d{2}$/.test(vrijednostDatuma)) {
            const [godina, mjesec, dan] = vrijednostDatuma.split("-").map(Number);
            datum = new Date(godina, mjesec - 1, dan);
        }

        const incident = forma.elements["incident"].checked;

        const rezultat = evidencija.dodajMjerenje({
            energent,
            kolicina,
            datum,
            incident
        });

        if (!rezultat.uspjesno) {
            poruke.textContent = rezultat.greske
                .map(greska => greska.poruka)
                .join("\n");

            const prvoPolje = forma.elements[rezultat.greske[0].polje];

            if (prvoPolje && typeof prvoPolje.focus === "function") {
                prvoPolje.focus();
            }

            return;
        }

        slanjeUtoku = true;
        setTimeout(() => {
            slanjeUtoku = false;
        }, 300);

        const svaMjerenja = evidencija.dajMjerenja();
        const novoMjerenje = svaMjerenja[svaMjerenja.length - 1];

        const noviRed = Array.from(tbody.rows).find(
            red => red.dataset.id === novoMjerenje.id
        );

        if (noviRed) {
            dodajDugmeZaBrisanje(noviRed);
            noviRed.classList.add("--new");

            setTimeout(() => {
                noviRed.classList.remove("--new");
            }, 2000);
        }

        azurirajKartice();

        forma.reset();

        poruke.textContent = "Mjerenje je uspješno dodano.";

        const dogadjaj = new CustomEvent("mjerenje:dodano", {
            bubbles: true,
            detail: {
                mjerenje: novoMjerenje
            }
        });

        tabela.dispatchEvent(dogadjaj);
    });

    tbody.addEventListener("click", function (event) {
        const dugme = event.target.closest('button[data-akcija="obrisi"]');

        if (!dugme) {
            return;
        }

        const red = dugme.closest("tr");
        const id = red.dataset.id;

        const uspjesno = evidencija.ukloniMjerenje(id);

        if (!uspjesno) {
            poruke.textContent = "Mjerenje nije moguće obrisati.";
            return;
        }

        azurirajKartice();

        poruke.textContent = "Mjerenje je uspješno obrisano.";

        const dogadjaj = new CustomEvent("mjerenje:uklonjeno", {
            bubbles: true,
            detail: {
                id
            }
        });

        tabela.dispatchEvent(dogadjaj);
    });

    if (dugmeIzveziCsv) {
        dugmeIzveziCsv.addEventListener("click", function () {
            const uspjesno = evidencija.izveziKaoCSV();
            poruke.textContent = uspjesno
                ? "CSV izvještaj je uspješno preuzet."
                : "Greška pri izvozu CSV izvještaja.";
        });
    }
})();