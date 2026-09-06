from PIL import Image
import numpy as np

# Load user uploaded image
img_path = r"C:\Users\tahir\.gemini\antigravity-ide\brain\6252af95-ddfd-4a63-9c38-409592d1adf4\.user_uploaded\media_1788702959559.png"
img = Image.open(img_path).convert('RGB')
w, h = img.size
print(f"Image size: {w}x{h}")

# Let's inspect the unique colors in the image
colors = img.getcolors(maxcolors=100000)
# Sort by count
colors.sort(key=lambda x: x[0], reverse=True)

# Find green-ish pixels (G > R and G > B)
green_pixels = []
for count, (r, g, b) in colors:
    if g > 30 and g > r * 1.2 and g > b * 1.2:
        green_pixels.append((count, f"#{r:02x}{g:02x}{b:02x}", (r, g, b)))

print(f"Top 20 green colors in user image:")
for count, hex_val, rgb in green_pixels[:20]:
    print(f"  Count: {count:5d}, Hex: {hex_val}, RGB: {rgb}")
