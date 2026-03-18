import re

file_path = r'c:\Users\sayoo\OneDrive\Desktop\java rest pos\cafe-qr-frontend\pages\owner\product-management.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: isPackagedGood inner input-row
# Look for HSN Code input followed by condition close `)` without a closing `</div>`
pattern1 = r'(<div className="input-group"><label>HSN Code</label>.*?</div>\s+)(\)\s+</div>)'
# Wait, let's be fully precise to avoid broke.
pattern1 = r'(<div className="input-group"><label>HSN Code</label>.*?</div>)\s+(\)\s+</div>)'
if re.search(pattern1, content, re.DOTALL):
    print("Found Pattern 1!")
else:
    print("Pattern 1 NOT found.")

# Let's do string replacement with fuzzy matching or safe patterns
# Fix 1:
search_str1 = """<div className="input-group"><label>HSN Code</label><input value={selectedProduct.taxCode || ''} onChange={e => setSelectedProduct({...selectedProduct, taxCode: e.target.value})} placeholder="e.g. 2106" /></div>
                    )}"""
# Wait, including lines is risky if indentations are mixed.
# Let's use Regex for EACH fix with flexible spaces \s*

# 1. isPackagedGood inner div row close
pattern = r'(<input value=\{selectedProduct\.taxCode.*?/></div>\s+)(\)\s+</div>)'
content, count1 = re.subn(r'(<input value=\{selectedProduct\.taxCode.*?/></div>\s*)(\)\s+</div>)', r'\1                    </div>\n\2', content, flags=re.DOTALL)
print(f"Applied Fix 1: {count1} times")

# 2. Availability inside info-options-row
# Pattern ends with `</>)}` right after switch knob </div>
# <div className="switch-knob"></div> \s+ </div> \s+ </>)}
pattern2 = r'(<div className="switch-knob"></div>\s+</div>\s+)(</>)\)}'
content, count2 = re.subn(pattern2, r'\1                 </div>\n                  </div>\n\2)}', content)
print(f"Applied Fix 2: {count2} times")

# 3. Inventory input-row close
# After Min Stock Level line, absolute close item
pattern3 = r'(<div className="input-group"><label>Min Stock Level</label>.*?</div>)(\s+<div className="input-group" style=\{\{ marginTop: \'16px\' \}\}>)'
content, count3 = re.subn(pattern3, r'\1\n                    </div>\2', content)
print(f"Applied Fix 3: {count3} times")

# 4. Inventory Section End
# After Barcode line, before </ fragment end
pattern4 = r'(<div className="input-group" style=\{\{ marginTop: \'16px\' \}\}>.*?</div>)(\s+</>)\)}'
content, count4 = re.subn(pattern4, r'\1\n                 </div>\2)}', content, flags=re.DOTALL)
print(f"Applied Fix 4: {count4} times")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished fixes")
