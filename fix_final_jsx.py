import sys

file_path = r'c:\Users\sayoo\OneDrive\Desktop\java rest pos\cafe-qr-frontend\pages\owner\product-management.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Variants Return Map (Around line 699)
found_1 = False
for i in range(len(lines)):
    if 'variantPricings' in "".join(lines[max(0, i-50):i]): # joins into context string
        if lines[i].strip() == ');' and lines[i-1].strip() == '</div>':
             lines[i] = '                                        </div>\n' + lines[i]
             print("Applied Fix 1: Variants pricing return map")
             found_1 = True
             break

# Fix 2: Variants Section End
found_2 = False
for i in range(len(lines)):
    if 'formTab === \'variants\'' in "".join(lines[max(0, i-100):i]):
        if lines[i].strip() == '</>)}' and lines[i-1].strip() == '</div>':
             lines[i] = '                  </div>\n' + lines[i]
             print("Applied Fix 2: Variants Section end")
             found_2 = True
             break

# Fix 3: Upsells Section End
found_3 = False
for i in range(len(lines)):
    if 'formTab === \'upsells\'' in "".join(lines[max(0, i-100):i]):
        if lines[i].strip() == '</>)}' and lines[i-1].strip() == '</div>':
             lines[i] = '                  </div>\n' + lines[i]
             print("Applied Fix 3: Upsells Section end")
             found_3 = True
             break

# Fix 4: Category Popup
found_4 = False
for i in range(len(lines)):
    if 'selectedCategory' in "".join(lines[max(0, i-100):i]):
         if lines[i].strip() == '</CafeQRPopup>' and lines[i-1].strip() == '</div>' and 'selectedCategory.isActive' in "".join(lines[max(0, i-10):i]):
              lines[i] = '                 </div>\n              </div>\n' + lines[i]
              print("Applied Fix 4: Category Popup")
              found_4 = True
              break

# Fix 5: UOM Popup
found_5a = False
found_5b = False
found_5c = False
for i in range(len(lines)):
    if 'selectedUom' in "".join(lines[max(0, i-100):i]):
         if 'selectedUom.isDefault' in lines[i] and 'erp-switch' in lines[i]:
              if lines[i+1].strip() == '<div className="switch-knob"></div>' and lines[i+2].strip() == '</div>':
                   lines[i+2] = lines[i+2].rstrip() + '\n                 </div>\n'
                   print("Applied Fix 5a: UOM isDefault control-row")
                   found_5a = True
         
         if 'selectedUom.isActive' in lines[i] and 'erp-switch' in lines[i]:
              if lines[i+1].strip() == '<div className="switch-knob"></div>' and lines[i+2].strip() == '</div>':
                   lines[i+2] = lines[i+2].rstrip() + '\n                 </div>\n'
                   print("Applied Fix 5b: UOM isActive control-row")
                   found_5b = True
                   
         if lines[i].strip() == '</CafeQRPopup>' and 'selectedUom.isActive' in "".join(lines[max(0, i-10):i]):
              lines[i] = '              </div>\n' + lines[i]
              print("Applied Fix 5c: UOM drawer-form")
              found_5c = True

# Fix 6: Variant Group Popup
for i in range(len(lines)):
    if 'selectedVariantGroup' in "".join(lines[max(0, i-100):i]):
         if 'selectedVariantGroup.isActive' in lines[i] and 'erp-switch' in lines[i]:
              if lines[i+1].strip() == '<div className="switch-knob"></div>' and lines[i+2].strip() == '</div>':
                   lines[i+2] = lines[i+2].rstrip() + '\n                 </div>\n'
                   print("Applied Fix 6a: Var group control-row")
                   
         if lines[i].strip() == '</CafeQRPopup>' and lines[i-1].strip() == '</div>' and 'selectedVariantGroup' in "".join(lines[max(0, i-30):i]):
              lines[i] = '              </div>\n' + lines[i]
              print("Applied Fix 6b: Var group drawer-form")

with open(file_path, 'w', encoding='utf-8') as f:
     f.writelines(lines)

print("Finished final fixes")
print(f"Stats: 1={found_1}, 2={found_2}, 3={found_3}, 4={found_4}, 5a={found_5a}, 5b={found_5b}, 5c={found_5c}")
