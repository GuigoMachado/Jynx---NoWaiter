from pathlib import Path

path = Path('seed_custom_items.sql')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()

mapping = {
    'Alcoólicos': [
        'https://images.unsplash.com/photo-1657313666513-70770d329ef4?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1570598912132-0ba1dc952b7d?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1592858167090-2473780d894d?auto=format&fit=crop&w=640&q=80',
    ],
    'Bebidas': [
        'https://images.unsplash.com/photo-1556742526-795a8eac090e?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=640&q=80',
    ],
    'Carnes': [
        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1541558615059-399f2a8a5d5f?auto=format&fit=crop&w=640&q=80',
    ],
    'Entradas': [
        'https://images.unsplash.com/photo-1607098665874-fd193397547b?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1676664778856-b48a7d87d831?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1606755456206-b25206cde27e?auto=format&fit=crop&w=640&q=80',
    ],
    'Porções': [
        'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1608219994488-cc269412b3e4?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1550259114-ad7188f0a967?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=640&q=80',
    ],
    'Pratos Principais': [
        'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1627042633145-b780d842ba45?auto=format&fit=crop&w=640&q=80',
    ],
    'Saladas': [
        'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1617884638394-d9eef1b0f40e?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1570197571499-166b36435e9f?auto=format&fit=crop&w=640&q=80',
    ],
}

prefix = 'https://source.unsplash.com/640x480/?'
counts = {category: 0 for category in mapping}
new_lines = []
for line in lines:
    modified_line = line
    for category, urls in mapping.items():
        if category in line and prefix in line:
            idx = line.index(prefix)
            start = idx + len(prefix)
            end = line.index("'", start)
            url = urls[counts[category] % len(urls)]
            counts[category] += 1
            modified_line = line[:idx] + url + line[end:]
            break
    new_lines.append(modified_line)

path.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
print('updated', path)
print(counts)
