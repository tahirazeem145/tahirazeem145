from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\tahir\.gemini\antigravity-ide\brain\6252af95-ddfd-4a63-9c38-409592d1adf4\.user_uploaded\media_1788702959559.png").convert('RGB')
arr = np.array(img)

# The legend is around y=[202..214], let's find the 4 legend squares at the bottom right
# Look at x between 750 and 920 at y=208
for x in range(750, 920):
    r, g, b = arr[208, x]
    print(f"x={x}: ({r}, {g}, {b}) #{r:02x}{g:02x}{b:02x}")
