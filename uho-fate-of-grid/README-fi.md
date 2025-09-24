# UHO: Fate of the Grid

Suomalainen verkkoselainpeli, joka on toteutettu TypeScript + HTML Canvas -teknologioilla. Pelissä on ruudukkopohjainen liikkuminen ja Ultima IV -tyylinen grafiikka. Kaikki pelin teksti on suomeksi.

## Pelin Kuvaus

UHO: Fate of the Grid on synkkä hiekkalaatikkotyyppinen elämänsimulaatio, joka sijoittuu fiktiiviseen Suomeen. Maailma koostuu isokartasta ja kaupungeista. Peli sisältää päihteet ja alkoholin (pakolliset mekaniikat), velkojenperinnän, tappeluita, lainvalvonnan (poliisi + partioautot), talouden, maineen, riippuvuuden ja seuraukset.

Tämä on yksipelimuotoinen hiekkalaatikko, joka ei vaadi backend-palvelinta.

## Tekniset Tiedot

**Teknologia-aihio:**
- TypeScript
- Vite/ESM
- HTML Canvas 2D

**Arkkitehtuuri:**
- ECS (Entity-Component-System)

**Komponentit:**
- Transform, Sprite, Stats, Needs, Inventory, Wallet, Addiction, Skills, AI, Vehicle, LawEnforcement, QuestFlag

**Järjestelmät:**
- MovementSystem, CollisionSystem, NeedsSystem, AddictionSystem, CombatSystem, PoliceAISystem, VehicleSystem, EconomySystem, SaveLoadSystem

**Grafiikka:**
- 16×16 tai 24×24 ruudut (skaalattu ×3-4)
- Paikkamerkkispritet proseduurisesti generoidulla grafiikalla
- Selkeä sprite-atlas-rajapinta PNG-taiteen vaihtamiseksi myöhemmin

## Asentaminen ja Käynnistäminen

### Vaatimukset
- Node.js (versio 18 tai uudempi)
- npm tai pnpm

### Asennus
```bash
# Kloonaa repositorio
git clone [repository-url]
cd uho-fate-of-grid

# Asenna riippuvuudet
npm install
# tai
pnpm install

# Käynnistä kehityspalvelin
npm run dev
# tai  
pnpm dev
```

### Testiversio
Jos sinulla on ongelmia riippuvuuksien kanssa, voit avata `test.html` tiedoston suoraan selaimessä nähdäksesi perusversion pelimekaniikoista.

## Ohjaimet

- **WASD** tai **Nuolinäppäimet**: Liiku
- **E**: Käytä/Tutki/Keskustele
- **I**: Avaa reppu
- **T**: Lepää
- **D**: Käytä päihdettä (testiversiossa)
- **F**: Varasta
- **L**: Murtaudu lukkoon
- **Space**: Kontekstitoiminto
- **S**: Tallenna peli

## Pelaajamekaniikat

**Vuoropohjainen ruudukkoliike** nuolinäppäimillä/WASD:lla.

**Tarpeet** vähenevät jokaisen vuoron aikana:
- Nälkä, Jano, Uni, Lämpö, Sosiaalisuus, Kipu, Hygienia

**Toiminnot:**
- Keskustele, Osta/Myy, Käytä esine, Käytä päihde, Varasta, Murtaudu lukkoon, Taistele/Uhkaile, Pakene, Aja, Piilo, Lepää, Hoida, Maksa velkaa

## Tilastot (15 ydintilastoa, 0-100)

1. **Voima** - Fyysinen vahvuus
2. **Kestävyys** - Väsymyksen sietokyky  
3. **Ketteryys** - Liikkuvuus ja nopeus
4. **Älykkyys** - Älykkyyden taso
5. **Havaitseminen** - Ympäristön tiedostaminen
6. **Karisma** - Sosiaalinen vetovoima
7. **Tahdonvoima** - Henkinen lujuus
8. **Onni** - Sattuman suosio
9. **Refleksit** - Reaktionopeus
10. **Sietokyky** - Kivun/myrkyn sietokyky
11. **Stressinsietokyky** - Stressin hallinta
12. **Tekninen Taito** - Lukot/ajoneuvot
13. **Rikoskokemus** - Rikollinen osaaminen
14. **Lääketieto** - Lääketieteellinen osaaminen
15. **Ovela** - Valehtelun/peuhasin taito

## Päihteet (fiktiiviset, abstraktit vaikutukset)

Peli sisältää yhdeksän eri päihdettä:
- Alkoholi, Kannabis, Amfetamiini, Opioidi, Bentsodiatsepiini, LSD, Psilosybiini, Nikotiini, Kofeiini

Jokainen päihde sisältää:
- `onUse()` tilapäiset buffit/debufit
- Toleranssi ja riippuvuuden kehittyminen
- Vieroitusoireet (tilastojen lasku, vapina, kipu)
- Yliannostusriski yhdistelmävaikutuksilla

## Talous ja Velat

- Käteinen + pankkitili
- "Perintätoimisto" NPC: viikoittainen korko, eskaloituva täytäntöönpano
- Työt: lailliset (rakennus, varasto), laittomat (kuriiri, myynti, ovimies)

## Poliisi ja Rikollisuus

- Epäilys/kuumuus-mittari
- Poliisi-NPCt partioivat; partioautot ajavat teillä
- Havaitseminen: näkö, ääni, todisteet
- Pidätys → dialogitarkistus, sakot, vankila/palvelu, esineiden takavarikointi

## Taistelujärjestelmä (väkivallatonta)

- Vuoropohjainen ruutukohtainen taistelu
- Aloitteellisuus, osumismahdollisuus, vahinko, moraali
- Ei-tappava tyrmäysvaihtoehto
- Varusteet toimivat panssarin bonuksina

## Modat ja Sisällön Muokkaus

Peli on suunniteltu moddattavaksi:
- Erillinen `data/` kansio sisällölle
- Erillinen `core/` kansio pelimoottorin koodille
- JSON-pohjaiset määritykset
- Helppo spritejen vaihtaminen

## Kehitystila

Tämä projekti on kehitysvaiheessa. Kaikki rikollinen toiminta ja päihteiden käyttö pelissä on fiktiivistä ja abstraktia pelimekaanikkaa - ei todellisia ohjeita.

## Testaus

```bash
# Suorita testit
npm run test
# tai
pnpm test

# Suorita testit UI:lla
npm run test:ui
# tai
pnpm test:ui
```

## Rakentaminen

```bash
# Rakenna tuotantoversio
npm run build
# tai
pnpm build
```

## Lisenssi

MIT License

## Tekijä

Ville Peuho

---

**Huomautus**: Kaikki pelin päihde-/rikosmekaniikat ovat fiktiivisiä ja abstrakteja, pelimekaniikkoja vain - ei todellisia elämänohjeita. Pidä se tekstipohjaisena ja ei-graafisena.