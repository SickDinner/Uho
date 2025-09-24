# 🎮 UHO: Fate of the Grid - Täysi Peliversio

**Suomalainen verkkoselainpeli - synkkä hiekkalaatikkotyyppinen elämänsimulaatio**

## 🚀 Pelin Käynnistäminen

### Nopea tapa (kehityspalvelimella):
```bash
npm run dev
# tai
pnpm dev
```
Sitten avaa selaimessa: `http://localhost:3000/uho-game.html`

### Suora tapa (ei rakennusta):
Avaa `uho-game.html` tiedosto suoraan selaimessa.

## 🎯 Pelin Tavoite

Selviydy ja menesty synkässä kaupungissa Suomessa. Tämä on hiekkalaatikko-tyyppinen elämänsimulaatio jossa on:

- **Päihdejärjestelmä**: 9 erilaista päihdettä riippuvuus- ja vieroitusmekaniikalla
- **Poliisin seuranta**: Kuumuus-järjestelmä ja aktiivinen poliisi-AI
- **Talousjärjestelmä**: Käteinen, pankkitili, velat ja kaupankäynti
- **Tarpeenjärjestelmä**: 7 elintärkeää tarvetta (nälkä, jano, uni jne.)
- **ECS-arkkitehtuuri**: Moderni Entity-Component-System pelimoottorina

## 🎮 Ohjaimet

### Perusliikkuminen:
- **WASD** tai **Nuolinäppäimet** = Liiku ruudukossa
- **E** = Vuorovaikuta NPCien kanssa (keskustele, osta, myy)
- **I** = Avaa/Sulje inventaario
- **T** = Lepää (palauttaa unta, kuluttaa nälkää/janoa)
- **F** = Yritä varastaa (nostaa poliisikuumuutta)
- **Välilyönti** = Kontekstitoiminto
- **ESC** = Pysäytä/Jatka peli

### Testikäyttöön (päihteet):
- **1** = Käytä alkoholia
- **2** = Käytä kannabista  
- **3** = Käytä amfetamiinia

### Dialogit ja valikot:
- **Nuolinäppäimet** = Navigoi vaihtoehdoissa
- **Enter** = Valitse
- **ESC** = Poistu

## 🌍 Pelimaailma

### Visuaalit:
- **Keltainen neliö** = Pelaaja (valkoinen nuoli näyttää katsomissuunnan)
- **Siniset neliöt** = Tavalliset NPCt
- **Punaiset neliöt** = Poliisi (vaarallisia!)
- **Violetit neliöt** = Huumekauppiaat
- **Vihreät neliöt** = Kauppiaat

### Kartta:
- **Tummansininen** = Tyhjä tila
- **Harmaa** = Katu/jalkakäytävä
- **Ruskea** = Rakennukset
- **Vihreä** = Kaupat
- **Kultainen** = Pankki
- **Punainen** = Poliisiasema

## ⚡ Pelimekaniikkaa

### Tarpeet (laskevat ajan myötä):
- **Nälkä** (-0.2/s): Syö ruokaa täyttääksesi
- **Jano** (-0.3/s): Juo nesteitä  
- **Uni** (-0.1/s): Lepää täyttääksesi (T-näppäin)
- **Lämpö** (-0.05/s): Pidä huoli lämmöstä
- **Sosiaalisuus** (-0.02/s): Keskustele ihmisten kanssa
- **Kipu** (+0.1/s): Paranee itsestään, pahentuu iskuista
- **Hygienia** (-0.1/s): Käy pesulla

### Tilastot (0-100):
- **Voima**: Fyysinen vahvuus
- **Kestävyys**: Väsymyksen sietokyky
- **Ketteryys**: Liikkuvuus ja nopeus
- **Älykkyys**: Älylliset kyvyt
- **Havainto**: Ympäristön tiedostaminen
- **Karisma**: Sosiaalinen vetovoima
- **Tahdonvoima**: Henkinen lujuus
- **Onni**: Sattuman suosio

### Päihdejärjestelmä:
Kaikki päihteet aiheuttavat:
- ✅ **Välittömät vaikutukset** (buffit/debufit)
- 📈 **Toleranssin kasvun** (vaatii enemmän)
- 🔗 **Riippuvuuden kehittymisen** (pakottava tarve)
- 💊 **Vieroitusoireet** (kun ei käytä)
- ☠️ **Yliannostusriskin** (liian paljon kerralla)

### Poliisijärjestelmä:
- **Kuumuus 0-100**: Mitä korkeampi, sitä enemmän poliisi kiinnostuu
- **Varkaus, väkivalta** = nostaa kuumuutta
- **Poliisi partioivat** = liikkuvat kartalla ja seuraavat sinua
- **Pidätysriski** = korkea kuumuus = pidätys = seuraukset

### Talousjärjestelmä:
- **Käteinen**: Päivittäiseen käyttöön
- **Pankkitili**: Turvallinen säilytyspaikka
- **Velat**: Korot kasvavat ajan myötä
- **Kaupankäynti**: Osta/myy NPCiltä

## 🏆 Strategioita

### Aloittelijoille:
1. **Pidä tarpeet täynnä**: Erityisesti uni ja ruoka
2. **Älä käytä liikaa päihteitä**: Riippuvuus kehittyy nopeasti
3. **Vältä poliisia**: Pidä kuumuus alhaisena
4. **Säästä rahaa**: Pankki on turvallisempi kuin taskut
5. **Tutki maailmaa**: Löydä kauppiaat ja turvalliset paikat

### Kokeneemmille:
- **Riski vs. tuotto**: Riskalttiimmat toimet = enemmän rahaa
- **Verkostoituminen**: NPCt muistavat sinua
- **Pitkäaikainen suunnittelu**: Rakenna maine ja verkostoja
- **Päihdestragiat**: Jotkut päihteet auttavat tietyissä tilanteissa

## ⚠️ Tärkeät Varoitukset

1. **Päihteet ovat vaarallisia**: Tämä on peli, älä kokeile oikeassa elämässä
2. **Riippuvuus kehittyy**: Vaikutukset ovat realistisia ja seuraukselliset
3. **Poliisi on aktiivista**: Korkealla kuumuudella pidätysriski kasvaa
4. **Tarpeet laskevat**: Jos ne menevät liian alhaisiksi, seuraa ongelmia
5. **Kaikki toiminta kuluttaa vuoroja**: Suunnittele tekemisesi

## 🛠️ Kehittäjätiedot

### Arkkitehtuuri:
- **ECS (Entity-Component-System)**: Moderni pelimoottorirakenne
- **TypeScript**: Type-safe kehitys
- **Canvas 2D**: Nopea pixel art -renderöinti
- **Modulaarinen rakenne**: Helppo laajentaa ja muokata

### Debugging:
Avaa selaimessa kehittäjäkonsoli (F12) ja käytä:
```javascript
// Pääsy peliobjektiin
window.uhoGame

// Pelaajan tilastot
window.uhoGame.systems.stats

// Maailman tila
window.uhoGame.world
```

## 🎨 Sisällönluonti

Peli on suunniteltu moddattavaksi:
- **data/drugs.ts**: Päihdemääritykset
- **core/components.ts**: Pelaajan ominaisuudet
- **core/systems.ts**: Pelimekaniikka
- **assets/**: Graafiset resurssit

## 📝 Lisenssi

MIT License - Vapaa käyttö ja muokkaus.

---

**🎮 Nauti pelistä ja muista: tämä on vain simulaatio!**

*UHO: Fate of the Grid on fiktiivinen peli. Kaikki päihde- ja rikostoiminta on abstraktia pelimekaniikkaa eikä todellisia ohjeita.*