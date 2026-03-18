import sys

file_path = r'c:\Users\sayoo\OneDrive\Desktop\java rest pos\cafe-qr-frontend\pages\owner\product-management.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: isPackagedGood inner input-row closing (Around line 591)
# Line: `                     )}`
for i in range(len(lines)):
    if 'isPackagedGood' in lines[max(0, i-20):i]:
        if 'taxCode' in lines[max(0, i-5):i]:
            if lines[i].strip() == ')}' and lines[i-1].strip() != '</div>':
                lines[i-1] = lines[i-1].rstrip() + '\n                      </div>\n'
                print("Applied Fix 1: isPackagedGood inner row")
                break

# Fix 2: Availability (Around line 600)
for i in range(len(lines)):
    if 'Availability' in lines[max(0, i-10):i]:
        if lines[i].strip() == '</>)}' and 'switch-knob' in lines[max(0, i-3):i]:
            # lines[i-1] is </div> closing erp-switch
            # We need to add 2 divs for control-row and info-options-row
            lines[i] = '                    </div>\n                 </div>\n' + lines[i]
            print("Applied Fix 2: Availability section closing")
            break

# Fix 3: Inventory input-row closing (After Min Stock Level)
for i in range(len(lines)):
    if 'Min Stock Level' in lines[max(0, i-5):i] and 'Barcode' in lines[min(len(lines)-1, i+1):min(len(lines), i+5)]:
        if lines[i].strip().startswith('<div') and 'Barcode' in lines[i]:
             lines[i] = '                    </div>\n' + lines[i]
             print("Applied Fix 3: Inventory input-row")
             break
# Wait, let's fix Fix 3 more accurately
for i in range(len(lines)):
    if 'Min Stock Level' in lines[i] and 'input-group' in lines[i]:
        if 'Barcode' in lines[i+1]:
             lines[i] = lines[i].rstrip() + '\n                    </div>\n'
             print("Applied Fix 3: Inventory input-row")
             break

# Fix 4: Inventory section end (Around line 619)
for i in range(len(lines)):
    if 'formTab === \'inventory\'' in lines[max(0, i-30):i]:
        if lines[i].strip() == '</>)}' and 'Barcode' in lines[max(0, i-10):i]:
             lines[i] = '                 </div>\n' + lines[i]
             print("Applied Fix 4: Inventory section end")
             break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Finished fixes")
