from PIL import Image
import numpy as np

img_path = r"C:\Users\tahir\.gemini\antigravity-ide\brain\6252af95-ddfd-4a63-9c38-409592d1adf4\.user_uploaded\media_1788702959559.png"
img = Image.open(img_path).convert('RGB')
arr = np.array(img)

# Print image dimensions
h, w, _ = arr.shape
print(f"Shape: {w} wide, {h} high")

# Let's find the grid area:
# In the image, find the bounding box of the green squares
green_mask = (arr[:, :, 1] > 40) & (arr[:, :, 1] > arr[:, :, 0] * 1.2) & (arr[:, :, 1] > arr[:, :, 2] * 1.2)
y_indices, x_indices = np.where(green_mask)
print(f"Green X range: {x_indices.min()} to {x_indices.max()}")
print(f"Green Y range: {y_indices.min()} to {y_indices.max()}")
print(f"Total green pixels: {len(y_indices)}")

# Let's inspect where the empty squares start and end
# Empty squares are dark gray around #161b22, let's find the table boundary
gray_mask = (arr[:, :, 0] > 18) & (arr[:, :, 0] < 30) & (arr[:, :, 1] > 22) & (arr[:, :, 1] < 35) & (arr[:, :, 2] > 30) & (arr[:, :, 2] < 45)
gy, gx = np.where(gray_mask)
if len(gx) > 0:
    print(f"Gray table X range: {gx.min()} to {gx.max()}")
    print(f"Gray table Y range: {gy.min()} to {gy.max()}")
