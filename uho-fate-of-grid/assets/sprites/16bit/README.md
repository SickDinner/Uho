# 16-Bit Sprite Assets

Tämä kansio sisältää 16-bit tyyppisiä sprite-resursseja "Fate of Grid" -pelille.

## 📁 Kansiorakenne

### `tilesets/`
- **tilemap.png** - Valmis tilemap kaupunkiympäristöille 
- **tilemap_packed.png** - Tiivistetty tilemap-versio
- **tile_0000.png - tile_0131.png** - Yksittäiset 16x16px tileet (132 kpl)

### `backgrounds/`
- **tiny_town_sample.png** - Esimerkki kaupunkimaailma

### `characters/`
- (Lisää hahmospritejä tänne tulevaisuudessa)

### `items/`
- (Lisää esinespritejä tänne tulevaisuudessa)  

### `effects/`
- (Lisää efektispritejä tänne tulevaisuudessa)

## 🎨 Kenney Tiny Town Pack

**Tyyli**: 16-bit pixel art (SNES/Genesis tyylinen)  
**Tile-koko**: 16x16 pikseliä  
**Paletti**: Rajoitettu väripaletti retro-tyyliin  
**Lisenssi**: CC0 (Katso kenney_license.txt)

### Sisältö:
- Katukivet ja tiet
- Rakennusten seinät ja katot  
- Ikkunat ja ovet
- Puita ja pensaita
- Lantarit ja katukalusteet
- Vesi-elementtejä

## 🚀 Käyttö pelissä

### Tilemappien lataus:
```typescript
// Lataa valmis tilemap
const tilemap = await loadTexture('assets/sprites/16bit/tilesets/tilemap.png');

// Tai yksittäiset tileet
const tile = await loadTexture('assets/sprites/16bit/tilesets/tile_0001.png');
```

### Suositetut tile-indeksit:
- **0-25**: Maapinnat ja tiet
- **26-50**: Seinät ja rakenneosat  
- **51-75**: Katot ja yläosat
- **76-100**: Kasvit ja luonto
- **101-131**: Erikoiselementit ja esineet

## 📋 Lisää sprite-paketteja

Lataa lisää Kenney.nl ZIP-paketteja `zip/` kansioon ja pura ne vastaavasti:

1. Lataa ZIP `assets/sprites/16bit/zip/` 
2. Pura: `Expand-Archive -Path "polku/paketti.zip" -DestinationPath "temp"`
3. Siirrä tiedostot oikeisiin alikansioihin

### Suositellut paketit:
- **Platformer Pack Redux** - Hahmoja ja platformereita
- **Roguelike/RPG Pack** - Fantasy-elementtejä  
- **Space Shooter Redux** - Sci-fi assetteja

---
*Luotu automaattisesti sprite-asennuksen yhteydessä*