#!/usr/bin/env python3
"""
🎮 LEGENDARY 16-BIT SPRITE GENERATOR 🎮

Yhdistää SNES:n, Jaguarin ja Genesisin parhaat grafiikka-ominaisuudet:
- SNES: Pixel-perfect sprites, paletized colors, clean animation frames
- Jaguar: Texture-mapped effects, advanced gradients, metallic surfaces  
- Genesis: High contrast colors, dithering techniques, sharp details

ULTIMATE RETRO POWER! ⚡🔥
"""

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
import os
import json
from typing import List, Tuple, Dict, Optional
import colorsys

class RetroColorPalette:
    """16-bit tyylinen väripalkki SNES-tyylillä"""
    
    def __init__(self, name: str):
        self.name = name
        self.colors: List[Tuple[int, int, int]] = []
        
    def add_color(self, r: int, g: int, b: int) -> int:
        """Lisää väri palettiiin ja palauttaa indeksin"""
        # Quantize to 5-bit per channel (SNES-style)
        r = (r >> 3) << 3
        g = (g >> 3) << 3  
        b = (b >> 3) << 3
        
        color = (r, g, b)
        if color not in self.colors:
            if len(self.colors) < 16:  # Max 16 colors per palette
                self.colors.append(color)
            else:
                # Find closest color
                return self.find_closest_color(r, g, b)
        return self.colors.index(color)
    
    def find_closest_color(self, r: int, g: int, b: int) -> int:
        """Löytää lähimmän värin paletista"""
        min_dist = float('inf')
        closest_index = 0
        
        for i, (pr, pg, pb) in enumerate(self.colors):
            dist = ((r-pr)**2 + (g-pg)**2 + (b-pb)**2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                closest_index = i
                
        return closest_index

class LegendarySprite:
    """16-bit sprite joka näyttää LEGENDAARISELTA!"""
    
    def __init__(self, width: int, height: int, name: str):
        self.width = width
        self.height = height
        self.name = name
        self.frames: List[np.ndarray] = []
        self.palette = RetroColorPalette(f"{name}_palette")
        
        # Add transparency as first color
        self.palette.add_color(0, 0, 0)  # Transparent black
        
    def add_frame(self, image_array: np.ndarray):
        """Lisää animaatioframe"""
        self.frames.append(image_array)
        
    def save_to_files(self, output_dir: str):
        """Tallenna sprite-tiedostot"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Create sprite sheet
        if self.frames:
            sheet_width = self.width * len(self.frames)
            sheet_height = self.height
            
            sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
            
            for i, frame in enumerate(self.frames):
                frame_img = Image.fromarray(frame, 'RGBA')
                sheet.paste(frame_img, (i * self.width, 0))
            
            sheet.save(os.path.join(output_dir, f"{self.name}.png"))
            
            # Save palette data
            palette_data = {
                "name": self.name,
                "colors": [{"r": r, "g": g, "b": b} for r, g, b in self.palette.colors],
                "width": self.width,
                "height": self.height,
                "frames": len(self.frames)
            }
            
            with open(os.path.join(output_dir, f"{self.name}_palette.json"), 'w') as f:
                json.dump(palette_data, f, indent=2)
                
            print(f"✅ Saved {self.name} sprite sheet with {len(self.frames)} frames")

class LegendarySpriteGenerator:
    """ULTIMATE sprite-generaattori joka tekee KAUNEIMMAT 16-bit spritet!"""
    
    def __init__(self):
        self.sprites: List[LegendarySprite] = []
        
    def create_enhanced_player_sprite(self) -> LegendarySprite:
        """Luo LEGENDAARINEN pelaaja-sprite SNES+Jaguar+Genesis tyylillä"""
        print("🚀 Creating LEGENDARY player sprite...")
        
        sprite = LegendarySprite(16, 16, "legendary_player")
        
        # Define colors with 16-bit quantization
        skin_base = sprite.palette.add_color(255, 220, 177)
        skin_shadow = sprite.palette.add_color(210, 180, 140)
        skin_highlight = sprite.palette.add_color(255, 240, 200)
        
        hair_base = sprite.palette.add_color(101, 67, 33)
        hair_shadow = sprite.palette.add_color(70, 45, 20)
        hair_highlight = sprite.palette.add_color(140, 95, 50)
        
        jacket_base = sprite.palette.add_color(72, 118, 170)
        jacket_shadow = sprite.palette.add_color(50, 85, 125)
        jacket_highlight = sprite.palette.add_color(100, 150, 200)
        
        pants_base = sprite.palette.add_color(45, 45, 60)
        pants_shadow = sprite.palette.add_color(30, 30, 40)
        pants_highlight = sprite.palette.add_color(65, 65, 85)
        
        shoes_base = sprite.palette.add_color(30, 30, 30)
        shirt_color = sprite.palette.add_color(240, 240, 240)
        
        # Create 4 directions × 4 animation frames each
        directions = ['south', 'west', 'east', 'north']
        
        for direction_idx, direction in enumerate(directions):
            for frame_idx in range(4):
                frame = np.zeros((16, 16, 4), dtype=np.uint8)
                
                # Animation offset for walking
                walk_offset = 0
                if frame_idx == 1:
                    walk_offset = -1
                elif frame_idx == 3:
                    walk_offset = 1
                
                # Draw character with Jaguar-style shading and SNES precision
                self.draw_legendary_character(
                    frame, sprite.palette, direction, walk_offset,
                    skin_base, skin_shadow, skin_highlight,
                    hair_base, hair_shadow, hair_highlight,
                    jacket_base, jacket_shadow, jacket_highlight,
                    pants_base, pants_shadow, pants_highlight,
                    shoes_base, shirt_color
                )
                
                sprite.add_frame(frame)
                
        print(f"🎨 Created player sprite with {len(sprite.frames)} frames")
        return sprite
        
    def draw_legendary_character(self, frame: np.ndarray, palette: RetroColorPalette,
                                direction: str, walk_offset: int, *colors):
        """Piirtää hahmon LEGENDAARISELLA 16-bit tyylillä"""
        
        skin_base, skin_shadow, skin_highlight = colors[0:3]
        hair_base, hair_shadow, hair_highlight = colors[3:6]  
        jacket_base, jacket_shadow, jacket_highlight = colors[6:9]
        pants_base, pants_shadow, pants_highlight = colors[9:12]
        shoes_base, shirt_color = colors[12:14]
        
        # HEAD (with Genesis-style dithering)
        head_y = 2
        self.draw_circle_with_shading(frame, palette, 8, head_y + 2, 3,
                                     skin_base, skin_shadow, skin_highlight)
        
        # HAIR (with SNES-style layering)  
        if direction != 'north':
            self.draw_hair_front(frame, palette, 8, head_y, direction,
                               hair_base, hair_shadow, hair_highlight)
        else:
            self.draw_hair_back(frame, palette, 8, head_y,
                              hair_base, hair_shadow, hair_highlight)
        
        # EYES (direction-dependent)
        if direction == 'south':
            self.set_pixel_safe(frame, palette, 7, head_y + 2, 0, 0, 0)  # Left eye
            self.set_pixel_safe(frame, palette, 9, head_y + 2, 0, 0, 0)  # Right eye
        elif direction == 'west':
            self.set_pixel_safe(frame, palette, 7, head_y + 2, 0, 0, 0)  # Visible eye
        elif direction == 'east':
            self.set_pixel_safe(frame, palette, 9, head_y + 2, 0, 0, 0)  # Visible eye
            
        # BODY (with Jaguar-style metallic shading)
        body_y = 6
        self.draw_rect_with_shading(frame, palette, 6, body_y, 4, 5,
                                  jacket_base, jacket_shadow, jacket_highlight)
        
        # SHIRT COLLAR  
        self.draw_rect_with_shading(frame, palette, 7, body_y, 2, 1,
                                  shirt_color, jacket_shadow, jacket_highlight)
        
        # ARMS (direction-dependent with Genesis optimization)
        if direction != 'west':
            self.draw_rect_with_shading(frame, palette, 10, body_y + 1, 1, 3,
                                      jacket_base, jacket_shadow, jacket_highlight)
        if direction != 'east':
            self.draw_rect_with_shading(frame, palette, 5, body_y + 1, 1, 3,
                                      jacket_base, jacket_shadow, jacket_highlight)
        
        # LEGS (with walking animation)
        legs_y = 11
        left_leg_y = legs_y + walk_offset
        right_leg_y = legs_y - walk_offset
        
        self.draw_rect_with_shading(frame, palette, 6, left_leg_y, 1, 4,
                                  pants_base, pants_shadow, pants_highlight)
        self.draw_rect_with_shading(frame, palette, 9, right_leg_y, 1, 4,
                                  pants_base, pants_shadow, pants_highlight)
        
        # SHOES (with highlight effects)
        self.set_pixel_safe(frame, palette, 5, left_leg_y + 3, *palette.colors[shoes_base])
        self.set_pixel_safe(frame, palette, 6, left_leg_y + 3, *palette.colors[shoes_base])
        self.set_pixel_safe(frame, palette, 9, right_leg_y + 3, *palette.colors[shoes_base])
        self.set_pixel_safe(frame, palette, 10, right_leg_y + 3, *palette.colors[shoes_base])
        
    def draw_circle_with_shading(self, frame: np.ndarray, palette: RetroColorPalette,
                               cx: int, cy: int, radius: int, 
                               base_color: int, shadow_color: int, highlight_color: int):
        """Piirtää varjostetun ympyrän Jaguar-tyylillä"""
        
        for y in range(max(0, cy - radius), min(frame.shape[0], cy + radius + 1)):
            for x in range(max(0, cx - radius), min(frame.shape[1], cx + radius + 1)):
                dx = x - cx
                dy = y - cy
                dist_sq = dx*dx + dy*dy
                
                if dist_sq <= radius*radius:
                    # Calculate shading based on position (simulate light from top-left)
                    light_factor = (-dx - dy) / (radius * 2)
                    
                    if light_factor > 0.3:
                        color_idx = highlight_color
                    elif light_factor < -0.3:
                        color_idx = shadow_color
                    else:
                        color_idx = base_color
                        
                    color = palette.colors[color_idx]
                    self.set_pixel_safe(frame, palette, x, y, *color)
                    
    def draw_rect_with_shading(self, frame: np.ndarray, palette: RetroColorPalette,
                             x: int, y: int, width: int, height: int,
                             base_color: int, shadow_color: int, highlight_color: int):
        """Piirtää varjostetun suorakulmion"""
        
        for py in range(y, min(frame.shape[0], y + height)):
            for px in range(x, min(frame.shape[1], x + width)):
                # Edge highlighting (SNES-style)
                if px == x or py == y:  # Top/left edges
                    color_idx = highlight_color
                elif px == x + width - 1 or py == y + height - 1:  # Bottom/right edges  
                    color_idx = shadow_color
                else:
                    color_idx = base_color
                    
                color = palette.colors[color_idx]
                self.set_pixel_safe(frame, palette, px, py, *color)
                
    def draw_hair_front(self, frame: np.ndarray, palette: RetroColorPalette,
                       cx: int, cy: int, direction: str,
                       base_color: int, shadow_color: int, highlight_color: int):
        """Piirtää hiukset edestä katsottuna"""
        
        # Hair outline
        hair_pixels = [
            (cx-2, cy), (cx-1, cy), (cx, cy), (cx+1, cy), (cx+2, cy),
            (cx-2, cy+1), (cx+2, cy+1),
            (cx-1, cy+2), (cx+1, cy+2)
        ]
        
        for px, py in hair_pixels:
            if direction == 'west' and px > cx:
                continue  # Hide right side when facing west
            if direction == 'east' and px < cx:
                continue  # Hide left side when facing east
                
            # Shading based on position
            if px < cx:
                color_idx = shadow_color if direction != 'east' else base_color
            elif px > cx:
                color_idx = highlight_color if direction != 'west' else base_color
            else:
                color_idx = base_color
                
            color = palette.colors[color_idx]
            self.set_pixel_safe(frame, palette, px, py, *color)
            
    def draw_hair_back(self, frame: np.ndarray, palette: RetroColorPalette,
                      cx: int, cy: int, base_color: int, shadow_color: int, highlight_color: int):
        """Piirtää hiukset takaa katsottuna"""
        
        back_hair_pixels = [
            (cx-2, cy), (cx-1, cy), (cx, cy), (cx+1, cy), (cx+2, cy),
            (cx-2, cy+1), (cx-1, cy+1), (cx, cy+1), (cx+1, cy+1), (cx+2, cy+1)
        ]
        
        for px, py in back_hair_pixels:
            color_idx = base_color
            color = palette.colors[color_idx]
            self.set_pixel_safe(frame, palette, px, py, *color)
            
    def set_pixel_safe(self, frame: np.ndarray, palette: RetroColorPalette,
                      x: int, y: int, r: int, g: int, b: int, a: int = 255):
        """Asettaa pikselin turvallisesti"""
        if 0 <= x < frame.shape[1] and 0 <= y < frame.shape[0]:
            frame[y, x] = [r, g, b, a]
            
    def create_urban_tileset(self) -> LegendarySprite:
        """Luo kaupunkiympäristön tiilet 16-bit tyylillä"""
        print("🏢 Creating urban tileset...")
        
        tileset = LegendarySprite(16, 16, "urban_tiles")
        
        # Urban color palette
        concrete_base = tileset.palette.add_color(128, 128, 128)
        concrete_dark = tileset.palette.add_color(96, 96, 96)
        concrete_light = tileset.palette.add_color(160, 160, 160)
        
        brick_base = tileset.palette.add_color(180, 100, 80)
        brick_dark = tileset.palette.add_color(140, 70, 50)
        brick_light = tileset.palette.add_color(220, 140, 120)
        
        asphalt_base = tileset.palette.add_color(64, 64, 64)
        asphalt_dark = tileset.palette.add_color(32, 32, 32)
        
        yellow_line = tileset.palette.add_color(255, 255, 0)
        white_line = tileset.palette.add_color(255, 255, 255)
        
        grass_base = tileset.palette.add_color(64, 128, 64)
        grass_dark = tileset.palette.add_color(32, 96, 32)
        grass_light = tileset.palette.add_color(96, 160, 96)
        
        # Create different tile types
        tile_types = [
            ("concrete_floor", concrete_base, concrete_dark, concrete_light),
            ("brick_wall", brick_base, brick_dark, brick_light),
            ("asphalt_road", asphalt_base, asphalt_dark, asphalt_base),
            ("grass_patch", grass_base, grass_dark, grass_light)
        ]
        
        for tile_name, base, dark, light in tile_types:
            frame = np.zeros((16, 16, 4), dtype=np.uint8)
            
            if "concrete" in tile_name:
                self.draw_concrete_tile(frame, tileset.palette, base, dark, light)
            elif "brick" in tile_name:
                self.draw_brick_wall(frame, tileset.palette, base, dark, light)
            elif "asphalt" in tile_name:
                self.draw_asphalt_road(frame, tileset.palette, base, dark, yellow_line)
            elif "grass" in tile_name:
                self.draw_grass_patch(frame, tileset.palette, base, dark, light)
                
            tileset.add_frame(frame)
            
        print(f"🎨 Created urban tileset with {len(tileset.frames)} tiles")
        return tileset
        
    def draw_concrete_tile(self, frame: np.ndarray, palette: RetroColorPalette,
                          base: int, dark: int, light: int):
        """Piirtää betonitiilet Genesis-tyylisellä dithering-tekniikalla"""
        
        base_color = palette.colors[base]
        dark_color = palette.colors[dark] 
        light_color = palette.colors[light]
        
        for y in range(16):
            for x in range(16):
                # Dithering pattern for texture
                if (x + y) % 4 == 0:
                    color = light_color
                elif (x + y) % 3 == 0:
                    color = dark_color
                else:
                    color = base_color
                    
                self.set_pixel_safe(frame, palette, x, y, *color)
                
    def draw_brick_wall(self, frame: np.ndarray, palette: RetroColorPalette,
                       base: int, dark: int, light: int):
        """Piirtää tiiliseinän SNES-tyylisellä tarkkuudella"""
        
        base_color = palette.colors[base]
        dark_color = palette.colors[dark]
        light_color = palette.colors[light]
        
        # Brick pattern
        for y in range(16):
            for x in range(16):
                # Mortar lines
                if y % 4 == 3 or (y // 4) % 2 == 0 and x % 8 == 7 or (y // 4) % 2 == 1 and x % 8 == 3:
                    color = dark_color
                # Brick highlights
                elif (x % 8 == 0 and (y // 4) % 2 == 0) or (x % 8 == 4 and (y // 4) % 2 == 1):
                    color = light_color
                else:
                    color = base_color
                    
                self.set_pixel_safe(frame, palette, x, y, *color)
                
    def draw_asphalt_road(self, frame: np.ndarray, palette: RetroColorPalette,
                         base: int, dark: int, line_color: int):
        """Piirtää asfalttitien"""
        
        base_rgb = palette.colors[base]
        dark_rgb = palette.colors[dark]
        line_rgb = palette.colors[line_color]
        
        for y in range(16):
            for x in range(16):
                # Road markings
                if y == 7 or y == 8:
                    if x % 4 < 2:  # Dashed line
                        color = line_rgb
                    else:
                        color = base_rgb
                # Asphalt texture
                else:
                    if (x + y * 3) % 7 == 0:
                        color = dark_rgb
                    else:
                        color = base_rgb
                        
                self.set_pixel_safe(frame, palette, x, y, *color)
                
    def draw_grass_patch(self, frame: np.ndarray, palette: RetroColorPalette,
                        base: int, dark: int, light: int):
        """Piirtää ruohikkoa"""
        
        base_color = palette.colors[base]
        dark_color = palette.colors[dark]
        light_color = palette.colors[light]
        
        for y in range(16):
            for x in range(16):
                # Grass blade pattern
                rand_val = (x * 7 + y * 11) % 13
                if rand_val < 2:
                    color = light_color
                elif rand_val < 5:
                    color = dark_color
                else:
                    color = base_color
                    
                self.set_pixel_safe(frame, palette, x, y, *color)

def main():
    """LEGENDARY sprite generation begins! 🚀"""
    print("🎮" + "="*60 + "🎮")
    print("     LEGENDARY 16-BIT SPRITE GENERATOR")
    print("     SNES + JAGUAR + GENESIS POWER!")
    print("🎮" + "="*60 + "🎮")
    
    generator = LegendarySpriteGenerator()
    output_dir = "assets/sprites/legendary"
    
    # Create legendary player sprite
    player_sprite = generator.create_enhanced_player_sprite()
    player_sprite.save_to_files(output_dir)
    
    # Create urban tileset
    urban_tiles = generator.create_urban_tileset()
    urban_tiles.save_to_files(output_dir)
    
    print("\n🏆 LEGENDARY SPRITE GENERATION COMPLETE! 🏆")
    print(f"📁 Files saved to: {output_dir}")
    print("⚡ Your game now has ULTIMATE 16-bit graphics! ⚡")

if __name__ == "__main__":
    main()