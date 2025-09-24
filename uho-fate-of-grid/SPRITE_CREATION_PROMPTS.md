# Professional Sprite Creation Prompts for UHO: Fate of the Grid

## Main Character Sprite - Detailed Prompt for GPT-5/Codex

### Technical Specifications
```
Format: 16x16 pixel sprite sheet
Dimensions: 64x64 pixels (4x4 grid)
Style: 16-bit pixel art, retro game aesthetic
Color palette: Limited to 16 colors maximum
Transparency: Required for background
Animation frames: 4 directions × 4 frames each
```

### Character Description
Create a main character sprite for "UHO: Fate of the Grid," a Finnish cyberpunk life simulation game set in urban Helsinki. The character should embody:

**Physical Appearance:**
- Finnish/Nordic appearance with realistic skin tone (pale to medium)
- Dark brown or black hair in a modern urban style
- Age: 25-35 years old
- Medium build, not overly muscular
- Contemporary street clothes suitable for urban exploration

**Clothing Style:**
- Dark blue or gray jacket/hoodie (main color)
- Dark jeans or cargo pants
- Practical urban footwear (sneakers or boots)
- Subtle details suggesting counter-culture/underground scene
- Colors should work well in both day and night environments

### Animation Frames Layout
```
[Idle S] [Walk S1] [Walk S2] [Walk S3]    (South-facing)
[Idle W] [Walk W1] [Walk W2] [Walk W3]    (West-facing)
[Idle E] [Walk E1] [Walk E2] [Walk E3]    (East-facing)
[Idle N] [Walk N1] [Walk N2] [Walk N3]    (North-facing)
```

### Technical Requirements
1. **Pixel Perfect**: Every pixel should be intentionally placed
2. **Consistent Style**: All frames must maintain the same art style
3. **Clear Silhouette**: Character should be recognizable at small sizes
4. **Smooth Animation**: Walking frames should create fluid movement
5. **Readable Details**: Important features visible even when scaled down

### Color Palette Suggestions
```
Primary Colors:
- Skin: #FFD3B1 (warm skin tone)
- Hair: #4A3420 (dark brown)
- Jacket: #4A7BA7 (muted blue)
- Pants: #2D2D3C (dark gray)
- Shoes: #1E1E1E (near black)

Accent Colors:
- Outline: #141414 (dark outline)
- Highlights: #FFFFFF (white highlights)
- Shadows: #666666 (mid gray)
```

---

## Alternative Sprite Prompts

### Prompt A: Minimalist Style
"Create a 16x16 pixel sprite sheet (64x64 total) for a minimalist character in Finnish urban setting. Focus on clean lines, limited color palette (8 colors max), and clear readability. Character should have simple geometric shapes representing a person in street clothes with walking animations for 4 directions."

### Prompt B: Detailed Pixel Art
"Design a detailed 16-bit style character sprite sheet (64x64 pixels) with 16 animation frames. Character is a Finnish urban explorer with realistic proportions, detailed clothing textures, and expressive animations. Include subtle details like clothing folds, hair texture, and facial features while maintaining pixel art aesthetics."

### Prompt C: Retro Game Style
"Create a character sprite in the style of classic 16-bit RPGs like Secret of Mana or Chrono Trigger. 64x64 pixel sheet with walking animations. Character should fit a modern urban cyberpunk setting while maintaining that nostalgic pixel art charm. Focus on character personality and distinctive silhouette."

---

## Implementation Code Template

```python
# For implementing the sprite once created
sprite_sheet_config = {
    'file_path': 'assets/sprites/player.png',
    'frame_width': 16,
    'frame_height': 16,
    'animations': {
        'idle_south': {'frames': [0], 'duration': 1000, 'loop': True},
        'walk_south': {'frames': [0, 1, 2, 3], 'duration': 200, 'loop': True},
        'idle_west': {'frames': [4], 'duration': 1000, 'loop': True},
        'walk_west': {'frames': [4, 5, 6, 7], 'duration': 200, 'loop': True},
        'idle_east': {'frames': [8], 'duration': 1000, 'loop': True},
        'walk_east': {'frames': [8, 9, 10, 11], 'duration': 200, 'loop': True},
        'idle_north': {'frames': [12], 'duration': 1000, 'loop': True},
        'walk_north': {'frames': [12, 13, 14, 15], 'duration': 200, 'loop': True}
    }
}
```

---

## Quality Checklist

### Visual Quality
- [ ] All pixels are intentionally placed (no accidental single pixels)
- [ ] Consistent lighting across all frames
- [ ] Clear contrast between character and background
- [ ] Readable at both 1x and 2x scale
- [ ] Character maintains consistent proportions

### Animation Quality
- [ ] Walking cycles look smooth and natural
- [ ] No jarring transitions between frames
- [ ] Consistent timing across all directions
- [ ] Character appears to move forward, not slide

### Technical Quality
- [ ] Proper transparency (no white/black backgrounds)
- [ ] Consistent 16x16 frame dimensions
- [ ] Correct sprite sheet layout
- [ ] Optimized file size
- [ ] Compatible with game engine

---

## Alternative Art Resources

If generating custom sprites proves challenging, consider these fallback options:

1. **Kenney's Assets** (already in assets/sprites/)
   - Free, high-quality pixel art
   - Consistent style
   - Multiple character options

2. **Modified Existing Sprites**
   - Recolor existing sprites to match theme
   - Add details to base sprites
   - Combine elements from multiple sprites

3. **Community Assets**
   - OpenGameArt.org
   - itch.io asset packs
   - CC0 pixel art collections

Remember: The goal is to create a memorable, recognizable character that fits the game's urban Finnish setting while maintaining excellent pixel art quality and smooth animations.