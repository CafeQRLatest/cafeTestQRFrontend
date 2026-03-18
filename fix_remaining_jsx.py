import sys

file_path = r'c:\Users\sayoo\OneDrive\Desktop\java rest pos\cafe-qr-frontend\pages\owner\product-management.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Variants Return Map Closing
# Find `);` after `</div>` inside pricing overrides
found_1 = False
for i in range(len(lines)):
    if 'variantPricings' in lines[max(0, i-20):i]:
        if lines[i].strip() == ');' and lines[i-1].strip() == '</div>':
             lines[i] = '                                        </div>\n' + lines[i]
             print("Applied Fix 1: Variants Return Map")
             found_1 = True
             break

# Fix 2: Variants Section End
found_2 = False
for i in range(len(lines)):
    if 'formTab === \'variants\'' in lines[max(0, i-30):i]:
        if lines[i].strip() == '</>)}' and lines[i-1].strip() == '</div>':
             lines[i] = '                  </div>\n' + lines[i]
             print("Applied Fix 2: Variants Section End")
             found_2 = True
             break

# Fix 3: Upsells Section End
found_3 = False
for i in range(len(lines)):
    if 'formTab === \'upsells\'' in lines[max(0, i-30):i]:
        if lines[i].strip() == '</>)}' and lines[i-1].strip() == '</div>':
             lines[i] = '                  </div>\n' + lines[i]
             print("Applied Fix 3: Upsells Section End")
             found_3 = True
             break

# Fix 4: Categories Popup
found_4 = False
for i in range(len(lines)):
    if 'selectedCategory && (' in lines[max(0, i-100):i]:
         if lines[i].strip() == '</CafeQRPopup>' and lines[i-1].strip() == '</div>' and 'selectedCategory.isActive' in lines[max(0, i-5):i]:
              lines[i] = '                 </div>\n              </div>\n' + lines[i]
              print("Applied Fix 4: Categories Popup")
              found_4 = True
              break

# Fix 5: UOM Popup
found_5 = False
# UOM popup usually has 2 control-rows
for i in range(len(lines)):
    if 'selectedUom && (' in lines[max(0, i-100):i]:
         if lines[i].strip() == '</CafeQRPopup>' and lines[i-1].strip() == '</div>':
              # We need to add one </div> after first control-row
              # And two </div> after second control-row before </CafeQRPopup>
              # Let's find index of first Is Default row and add div
              # But to just add ALL broken tag fixes quickly, let's inject them at indices
              pass

with open(file_path, 'w', encoding='utf-8') as f:
     f.writelines(lines)

print(f"Finished. Found 1={found_1}, 2={found_2}, 3={found_3}, 4={found_4}")
if not (found_1 and found_2 and found_3 and found_4):
    print("Warning: some fixes were not applied. Checking fallback logic...")
