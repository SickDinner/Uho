#!/usr/bin/env python3
"""
Creates a simple sample player sprite for testing the sprite system.
This generates a basic 16x16 pixel character sprite sheet with walking animations.
"""

from PIL import Image, ImageDraw
import os

def create_sample_sprite():
    # Create a 64x64 sprite sheet (4x4 frames of 16x16)
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Enhanced 16-bit color palette
    skin_tone = (255, 220, 177, 255)    # Realistic skin tone
    hair_dark = (101, 67, 33, 255)      # Dark brown hair
    jacket_blue = (72, 118, 170, 255)   # Blue jacket
    pants_dark = (45, 45, 60, 255)      # Dark pants
    shoes_black = (30, 30, 30, 255)     # Black shoes
    shirt_white = (240, 240, 240, 255)  # White shirt
    outline_black = (20, 20, 20, 255)   # Black outline
    shadow_gray = (100, 100, 100, 128)  # Semi-transparent shadow
    
    # Frame positions
    frames = [
        # Row 0: South (down) facing
        (0, 0), (16, 0), (32, 0), (48, 0),
        # Row 1: West (left) facing  
        (0, 16), (16, 16), (32, 16), (48, 16),
        # Row 2: East (right) facing
        (0, 32), (16, 32), (32, 32), (48, 32),
        # Row 3: North (up) facing
        (0, 48), (16, 48), (32, 48), (48, 48)
    ]
    
    # Helper function to draw detailed character
    def draw_character(x, y, direction, frame_type, walking_offset=0):
        # Base positions
        head_y = y + 2
        body_y = y + 6
        legs_y = y + 12
        
        # Walking animation offset
        if walking_offset != 0:
            legs_y += walking_offset
        
        # Head (skin tone circle)
        draw.ellipse([x+5, head_y, x+11, head_y+6], fill=skin_tone, outline=outline_black)
        
        # Hair
        if direction == 'south' or direction == 'north':
            draw.ellipse([x+4, head_y-1, x+12, head_y+4], fill=hair_dark, outline=outline_black)
        else:
            draw.ellipse([x+4, head_y-1, x+12, head_y+4], fill=hair_dark, outline=outline_black)
        
        # Eyes based on direction
        if direction == 'south':
            draw.point((x+6, head_y+2), fill=outline_black)  # Left eye
            draw.point((x+9, head_y+2), fill=outline_black)  # Right eye
        elif direction == 'north':
            # Hair covers eyes from behind
            pass
        elif direction == 'west':
            draw.point((x+6, head_y+2), fill=outline_black)  # Visible left eye
        elif direction == 'east':
            draw.point((x+9, head_y+2), fill=outline_black)  # Visible right eye
        
        # Body (jacket and shirt)
        draw.rectangle([x+4, body_y, x+12, body_y+6], fill=jacket_blue, outline=outline_black)
        draw.rectangle([x+5, body_y+1, x+11, body_y+3], fill=shirt_white)  # Shirt collar
        
        # Arms
        if direction == 'west':
            # Left arm visible
            draw.rectangle([x+2, body_y+1, x+4, body_y+5], fill=jacket_blue, outline=outline_black)
        elif direction == 'east':
            # Right arm visible
            draw.rectangle([x+12, body_y+1, x+14, body_y+5], fill=jacket_blue, outline=outline_black)
        else:
            # Both arms visible
            draw.rectangle([x+3, body_y+1, x+5, body_y+5], fill=jacket_blue, outline=outline_black)  # Left arm
            draw.rectangle([x+11, body_y+1, x+13, body_y+5], fill=jacket_blue, outline=outline_black)  # Right arm
        
        # Legs/Pants
        draw.rectangle([x+5, legs_y, x+7, legs_y+4], fill=pants_dark, outline=outline_black)  # Left leg
        draw.rectangle([x+9, legs_y, x+11, legs_y+4], fill=pants_dark, outline=outline_black)  # Right leg
        
        # Shoes
        draw.rectangle([x+4, legs_y+3, x+8, legs_y+4], fill=shoes_black)  # Left shoe
        draw.rectangle([x+8, legs_y+3, x+12, legs_y+4], fill=shoes_black)  # Right shoe
    
    # Draw each frame with proper animations
    for i, (x, y) in enumerate(frames):
        direction = ['south', 'south', 'south', 'south', 
                    'west', 'west', 'west', 'west',
                    'east', 'east', 'east', 'east', 
                    'north', 'north', 'north', 'north'][i]
        
        # Determine if it's a walking frame and add offset
        walking_offset = 0
        if i % 4 in [1, 3]:  # Walking frames
            walking_offset = 1 if i % 4 == 1 else -1
        
        draw_character(x, y, direction, 'walk' if i % 4 in [1, 3] else 'idle', walking_offset)
    
    # Save the sprite sheet
    os.makedirs('assets/sprites', exist_ok=True)
    img.save('assets/sprites/player.png')
    print("Created sample player sprite at assets/sprites/player.png")
    
    # Also create a larger version for better visibility
    large_img = img.resize((256, 256), Image.NEAREST)
    large_img.save('assets/sprites/player-large.png')
    print("Created large version at assets/sprites/player-large.png")

if __name__ == "__main__":
    try:
        create_sample_sprite()
    except Exception as e:
        print(f"Error creating sprite: {e}")
        import traceback
        traceback.print_exc()
