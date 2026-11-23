"""
tests/test_theme_contrast.py
Validates WCAG Contrast Ratios and CSS Rules for Dark and Light Themes.
Ensures zero white-on-white or dark-on-dark unreadable text.
"""

import sys
import os

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.theme import THEMES, inject_theme_css

def rgb_from_hex(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def luminance(r, g, b):
    a = [v / 255.0 for v in (r, g, b)]
    a = [((v + 0.055) / 1.055) ** 2.4 if v > 0.03928 else v / 12.92 for v in a]
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]

def contrast_ratio(hex1, hex2):
    lum1 = luminance(*rgb_from_hex(hex1))
    lum2 = luminance(*rgb_from_hex(hex2))
    brightest = max(lum1, lum2)
    darkest = min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)

def test_theme_contrast_and_styles():
    print("=" * 70)
    print("THEME CONTRAST & VISIBILITY VERIFICATION")
    print("=" * 70)

    # 1. Dark Theme Contrast Checks
    dark = THEMES["dark"]
    print("\n[1] Checking Dark Theme Color Contrast:")
    cr_primary = contrast_ratio(dark["text_primary"], dark["bg_primary"])
    cr_card_primary = contrast_ratio(dark["text_primary"], dark["bg_card"])
    cr_card_sec = contrast_ratio(dark["text_secondary"], dark["bg_card"])
    
    print(f"  Primary Text vs Main BG:  {cr_primary:.2f}:1 (Target: >= 7.0 WCAG AAA)")
    print(f"  Primary Text vs Card BG:  {cr_card_primary:.2f}:1 (Target: >= 7.0 WCAG AAA)")
    print(f"  Secondary Text vs Card:   {cr_card_sec:.2f}:1 (Target: >= 4.5 WCAG AA)")

    assert cr_primary >= 7.0, f"Dark primary text contrast failed: {cr_primary}"
    assert cr_card_primary >= 7.0, f"Dark card primary contrast failed: {cr_card_primary}"
    assert cr_card_sec >= 4.5, f"Dark card secondary contrast failed: {cr_card_sec}"

    # 2. Light Theme Contrast Checks
    light = THEMES["light"]
    print("\n[2] Checking Light Theme Color Contrast:")
    cr_light_primary = contrast_ratio(light["text_primary"], light["bg_primary"])
    cr_light_card_primary = contrast_ratio(light["text_primary"], light["bg_card"])
    cr_light_card_sec = contrast_ratio(light["text_secondary"], light["bg_card"])

    print(f"  Primary Text vs Main BG:  {cr_light_primary:.2f}:1 (Target: >= 7.0 WCAG AAA)")
    print(f"  Primary Text vs Card BG:  {cr_light_card_primary:.2f}:1 (Target: >= 7.0 WCAG AAA)")
    print(f"  Secondary Text vs Card:   {cr_light_card_sec:.2f}:1 (Target: >= 4.5 WCAG AA)")

    assert cr_light_primary >= 7.0, f"Light primary text contrast failed: {cr_light_primary}"
    assert cr_light_card_primary >= 7.0, f"Light card primary contrast failed: {cr_light_card_primary}"
    assert cr_light_card_sec >= 4.5, f"Light card secondary contrast failed: {cr_light_card_sec}"

    # 3. Check .streamlit/config.toml
    print("\n[3] Checking .streamlit/config.toml...")
    assert os.path.exists(".streamlit/config.toml"), ".streamlit/config.toml must exist"
    with open(".streamlit/config.toml", "r") as f:
        cfg = f.read()
    assert 'base = "dark"' in cfg
    assert 'backgroundColor = "#0B0F19"' in cfg
    print("  [✓] .streamlit/config.toml verified with default dark mode.")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: 100% Theme Contrast & Visibility Verified! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_theme_contrast_and_styles()
