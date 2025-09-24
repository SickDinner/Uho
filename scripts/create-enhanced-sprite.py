#!/usr/bin/env python3
"""
Creates an enhanced player sprite for UHO: Fate of the Grid
This generates a detailed 16x16 pixel character sprite sheet with walking animations.
"""

from PIL import Image, ImageDraw
import os

def create_enhanced_sprite():
    print("Creating enhanced player sprite...")
    
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
    
    # Frame positions: 4 directions x 4 frames each
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
    def draw_character(x, y, direction, is_walking, leg_offset=0):
        # Base positions
        head_y = y + 2
        body_y = y + 6
        legs_y = y + 11
        
        # Leg animation for walking
        left_leg_y = legs_y + (leg_offset if is_walking else 0)
        right_leg_y = legs_y + (-leg_offset if is_walking else 0)
        
        # Head
        draw.ellipse([x+6, head_y, x+10, head_y+4], fill=skin_tone, outline=outline_black)
        
        # Hair
        draw.arc([x+5, head_y-1, x+11, head_y+3], 0, 180, fill=hair_dark)
        draw.rectangle([x+5, head_y, x+11, head_y+2], fill=hair_dark)
        
        # Eyes (based on direction)
        if direction == 'south':
            draw.point((x+7, head_y+2), fill=outline_black)  # Left eye
            draw.point((x+9, head_y+2), fill=outline_black)  # Right eye
        elif direction == 'west':
            draw.point((x+7, head_y+2), fill=outline_black)  # Left eye visible
        elif direction == 'east':
            draw.point((x+9, head_y+2), fill=outline_black)  # Right eye visible
        # North - no eyes visible (back of head)
        
        # Body - jacket
        draw.rectangle([x+5, body_y, x+11, body_y+5], fill=jacket_blue, outline=outline_black)
        
        # Shirt collar
        draw.rectangle([x+6, body_y+1, x+10, body_y+2], fill=shirt_white)
        
        # Arms (simplified)
        if direction != 'west':  # Right arm visible unless facing west
            draw.rectangle([x+11, body_y+1, x+12, body_y+4], fill=jacket_blue, outline=outline_black)
        if direction != 'east':  # Left arm visible unless facing east
            draw.rectangle([x+4, body_y+1, x+5, body_y+4], fill=jacket_blue, outline=outline_black)
        
        # Legs - pants
        draw.rectangle([x+6, left_leg_y, x+7, left_leg_y+4], fill=pants_dark, outline=outline_black)  # Left leg
        draw.rectangle([x+9, right_leg_y, x+10, right_leg_y+4], fill=pants_dark, outline=outline_black)  # Right leg
        
        # Shoes
        draw.rectangle([x+5, left_leg_y+3, x+8, left_leg_y+4], fill=shoes_black)  # Left shoe
        draw.rectangle([x+8, right_leg_y+3, x+11, right_leg_y+4], fill=shoes_black)  # Right shoe
    
    # Draw all frames
    directions = ['south', 'west', 'east', 'north']
    
    for i, (x, y) in enumerate(frames):
        direction = directions[i // 4]  # 4 frames per direction
        frame_in_direction = i % 4
        
        # Animation: frames 1 and 3 are walking frames
        is_walking = frame_in_direction in [1, 3]
        leg_offset = 1 if frame_in_direction == 1 else (-1 if frame_in_direction == 3 else 0)
        
        draw_character(x, y, direction, is_walking, leg_offset)
    
    # Save the sprite sheet
    os.makedirs('assets/sprites', exist_ok=True)
    img.save('assets/sprites/player.png')
    print("✓ Created enhanced player sprite at assets/sprites/player.png")
    
    # Also create a larger version for preview
    large_img = img.resize((256, 256), Image.NEAREST)
    large_img.save('assets/sprites/player-large.png')
    print("✓ Created large preview at assets/sprites/player-large.png")
    
    return True

if __name__ == "__main__":
    try:
        success = create_enhanced_sprite()
        if success:
            print("🎮 Sprite creation completed successfully!")
        else:
            print("❌ Sprite creation failed!")
    except Exception as e:
        print(f"❌ Error creating sprite: {e}")
        import traceback
        traceback.print_exc()