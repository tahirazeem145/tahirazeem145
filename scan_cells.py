from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\tahir\.gemini\antigravity-ide\brain\6252af95-ddfd-4a63-9c38-409592d1adf4\.user_uploaded\media_1788702959559.png").convert('RGB')
arr = np.array(img)

# Rows centers:
rows_y = [89, 105, 120, 136, 151, 167, 182]

# Let's find all column centers by stepping from the right edge of the table
# The last column x is around 896
# Step is roughly 15.4px
# Let's find all column positions across the table (53 columns):
# We know the rightmost column center is around 896
# Let's test steps: 896 - 52 * 15.35 = 97.8, which matches the table start around x=98!
# Let's precisely measure each column center by looking at the squares:

col_centers = []
for col_idx in range(53):
    # approximate x
    est_x = int(round(896 - (52 - col_idx) * 15.346))
    col_centers.append(est_x)

grid_cells = []
for c_idx, cx in enumerate(col_centers):
    col_data = []
    for r_idx, cy in enumerate(rows_y):
        # sample a 5x5 patch around (cx, cy)
        patch = arr[cy-2:cy+3, cx-2:cx+3]
        mean_r = np.mean(patch[:, :, 0])
        mean_g = np.mean(patch[:, :, 1])
        mean_b = np.mean(patch[:, :, 2])
        is_green = (mean_g > 35) and (mean_g > mean_r * 1.15) and (mean_g > mean_b * 1.15)
        # Determine level
        level = 0
        if is_green:
            if mean_g > 180:
                level = 4
            elif mean_g > 130:
                level = 3
            elif mean_g > 80:
                level = 2
            else:
                level = 1
        col_data.append((level, (int(mean_r), int(mean_g), int(mean_b))))
    grid_cells.append(col_data)

print(f"Total columns scanned: {len(grid_cells)}")
total_active = sum(1 for c in grid_cells for r in c if r[0] > 0)
print(f"Total active cells detected in image: {total_active}")

# Print active columns
for c_idx, col in enumerate(grid_cells):
    active_in_col = [r_idx for r_idx, r in enumerate(col) if r[0] > 0]
    if active_in_col:
        print(f"Col {c_idx} (approx week): active rows={active_in_col}, levels={[col[r][0] for r in active_in_col]}")
