
import { Evidencija } from "./Evidencija.js";

// HTML elementi
const tabela = document.querySelector('table[data-testid="tabela"]');
const tbody = tabela.querySelector("tbody");

const forma = document.querySelector("#forma-mjerenje");
const poruke = document.querySelector("#poruke");

const karticaEmisija = document.querySelector(
    '[data-testid="kartica-emisija"]'
);

const karticaUsteda = document.querySelector(
    '[data-testid="kartica-usteda"]'
);

const karticaStatus = document.querySelector(
    '[data-testid="kartica-status"]'
);

// Kreiranje evidencije
const evidencija = Evidencija(tabela);

// Formatiranje brojeva
function formatirajBroj(broj) {
    return broj.toFixed(2).replace(".", ",");
}

// Ažuriranje sve tri kartice
function azurirajKartice() {
    const ukupnaEmisija = evidencija.dajUkupnuEmisiju();

    const usteda = ukupnaEmisija * 0.20;

    const mjerenja = evidencija.dajMjerenja();

    const postojiIncident = mjerenja.some(
        mjerenje => mjerenje.incident === true
    );

    karticaEmisija.textContent =
        `${formatirajBroj(ukupnaEmisija)} kg`;

    karticaUsteda.textContent =
        `${formatirajBroj(usteda)} kg`;

    karticaStatus.textContent = postojiIncident
        ? "Kritično"
        : "Normalno";
}

// Kreiranje dugmeta za brisanje u redu tabele
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

    dugme.setAttribute(
        "aria-label",
        `Obriši mjerenje ${red.dataset.id}`
    );

    celija.appendChild(dugme);
}

// Dodavanje dugmadi za već postojeće redove
Array.from(tbody.rows).forEach(red => {
    dodajDugmeZaBrisanje(red);
});

// Početno ažuriranje kartica
azurirajKartice();

// Zaštita od višestrukog slanja
let slanjeUtoku = false;

// Obrada forme
forma.addEventListener("submit", function (event) {
    event.preventDefault();

    if (slanjeUtoku) {
        return;
    }

    slanjeUtoku = true;

    setTimeout(() => {
        slanjeUtoku = false;
    }, 300);

    const energent = forma.elements["energent"].value;
    const kolicina = Number(forma.elements["kolicina"].value);

    const vrijednostDatuma = forma.elements["datum"].value;
    const [godina, mjesec, dan] = vrijednostDatuma
        .split("-")
        .map(Number);

    // Kreiranje lokalnog Date objekta
    const datum = new Date(godina, mjesec - 1, dan);

    const incident = forma.elements["incident"].checked;

    const rezultat = evidencija.dodajMjerenje({
        energent,
        kolicina,
        datum,
        incident
    });

    // Ako je unos neuspješan
    if (!rezultat.uspjesno) {
        poruke.textContent = rezultat.greske
            .map(greska => greska.poruka)
            .join("\n");

        const prvoPolje = forma.elements[
            rezultat.greske[0].polje
        ];

        if (prvoPolje && typeof prvoPolje.focus === "function") {
            prvoPolje.focus();
        }

        return;
    }

    // Dohvatanje upravo dodanog mjerenja
    const svaMjerenja = evidencija.dajMjerenja();

    const novoMjerenje = svaMjerenja[svaMjerenja.length - 1];

    // Pronalaženje novog reda
    const noviRed = Array.from(tbody.rows).find(
        red => red.dataset.id === novoMjerenje.id
    );

    // Dodavanje dugmeta za brisanje
    dodajDugmeZaBrisanje(noviRed);

    // Animacija novog reda
    noviRed.classList.add("--new");

    setTimeout(() => {
        noviRed.classList.remove("--new");
    }, 2000);

    // Ažuriranje kartica
    azurirajKartice();

    // Čišćenje forme
    forma.reset();

    // Potvrdna poruka
    poruke.textContent = "Mjerenje je uspješno dodano.";

    // Kreiranje custom događaja
    const dogadjaj = new CustomEvent("mjerenje:dodano", {
        bubbles: true,
        detail: {
            mjerenje: novoMjerenje
        }
    });

    tabela.dispatchEvent(dogadjaj);
});

// Obrada brisanja preko delegiranja događaja
tbody.addEventListener("click", function (event) {
    const dugme = event.target.closest(
        'button[data-akcija="obrisi"]'
    );

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

    // Ažuriranje kartica
    azurirajKartice();

    poruke.textContent = "Mjerenje je uspješno obrisano.";

    // Kreiranje custom događaja
    const dogadjaj = new CustomEvent("mjerenje:uklonjeno", {
        bubbles: true,
        detail: {
            id: id
        }
    });

    tabela.dispatchEvent(dogadjaj);
});
