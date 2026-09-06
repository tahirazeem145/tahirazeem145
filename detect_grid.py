from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\tahir\.gemini\antigravity-ide\brain\6252af95-ddfd-4a63-9c38-409592d1adf4\.user_uploaded\media_1788702959559.png").convert('RGB')
arr = np.array(img)

# Let's inspect the 7 rows
# In GitHub contribution calendar, there are labels "Mon", "Wed", "Fri"
# Let's find the 7 row Y ranges:
# Let's find the centers by grouping contiguous Y indices with green pixels
y_green = (arr[:, :, 1] > 40) & (arr[:, :, 1] > arr[:, :, 0] * 1.2)
y_profile = y_green.sum(axis=1)

y_groups = []
in_group = False
start_y = 0
for y in range(80, 220):
    if y_profile[y] > 5:
        if not in_group:
            in_group = True
            start_y = y
    else:
        if in_group:
            in_group = False
            y_groups.append((start_y, y - 1, (start_y + y - 1) // 2))

print(f"Row groups found: {len(y_groups)}")
for idx, (y1, y2, ym) in enumerate(y_groups):
    print(f"  Row {idx}: y=[{y1}..{y2}], center={ym}, height={y2 - y1 + 1}")

# Group columns:
x_profile = y_green.sum(axis=0)
x_groups = []
in_group = False
start_x = 0
for x in range(500, 920):
    if x_profile[x] > 2:
        if not in_group:
            in_group = True
            start_x = x
    else:
        if in_group:
            in_group = False
            x_groups.append((start_x, x - 1, (start_x + x - 1) // 2))

print(f"Column groups with green found: {len(x_groups)}")
for idx, (x1, x2, xm) in enumerate(x_groups):
    print(f"  Col {idx}: x=[{x1}..{x2}], center={xm}, width={x2 - x1 + 1}")
