import textwrap

indented_str = """
        <div class="brand-title">RETAILPULSE</div>
"""
dedented_str = textwrap.dedent(indented_str).strip()

print("Original representation:")
print(repr(indented_str))
print("\nDedented representation:")
print(repr(dedented_str))
print("\nOriginal starts with newline and spaces:", indented_str.startswith("\n        "))
print("Dedented starts with tag:", dedented_str.startswith('<div class="brand-title">'))
