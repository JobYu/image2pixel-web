/**
 * Convert desktop GPL bead palettes to web-friendly JSON format.
 * Perler uses product SKUs (80-XXXXX) in CODE fields, which must be
 * mapped to official P-numbers (P01~P961). Other brands already use
 * their official numbering in CODE fields.
 *
 * Usage: node scripts/convert-bead-palettes.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.resolve(__dirname, '../../pixelit/Image2pixel/palette/bead-palettes');
const OUTPUT_DIR = path.resolve(__dirname, '../web/palette/bead-palettes');

// Perler product SKU → official P-number mapping
// Source: https://www.fusebeadideas.com/perler-bead-numbers-color-codes/
const PERLER_SKU_TO_PNUMBER = {
  '80-19001': 'P01',   // White
  '80-19002': 'P02',   // Creme
  '80-19003': 'P03',   // Yellow
  '80-19004': 'P04',   // Orange
  '80-19005': 'P05',   // Red
  '80-19006': 'P06',   // Bubblegum
  '80-19007': 'P07',   // Purple
  '80-19008': 'P08',   // Dark Blue
  '80-19009': 'P09',   // Light Blue
  '80-19010': 'P10',   // Dark Green
  '80-19011': 'P11',   // Light Green
  '80-19012': 'P12',   // Brown
  '80-19017': 'P17',   // Grey
  '80-19018': 'P18',   // Black
  '80-19020': 'P20',   // Rust
  '80-19021': 'P21',   // Light Brown
  '80-19033': 'P33',   // Peach
  '80-19035': 'P35',   // Tan
  '80-19038': 'P38',   // Magenta
  '80-19052': 'P52',   // Pastel Blue
  '80-19053': 'P53',   // Pastel Green
  '80-19054': 'P54',   // Pastel Lavender
  '80-19056': 'P56',   // Pastel Yellow
  '80-19057': 'P57',   // Cheddar
  '80-19058': 'P58',   // Toothpaste
  '80-19059': 'P59',   // Hot Coral
  '80-19060': 'P60',   // Plum
  '80-19061': 'P61',   // Kiwi Lime
  '80-19062': 'P62',   // Turquoise
  '80-19063': 'P63',   // Blush
  '80-19070': 'P70',   // Periwinkle Blue
  '80-19079': 'P79',   // Light Pink
  '80-19080': 'P80',   // Bright Green
  '80-19083': 'P83',   // Pink
  '80-19088': 'P88',   // Raspberry
  '80-19090': 'P90',   // Butterscotch
  '80-19091': 'P91',   // Parrot Green
  '80-19092': 'P92',   // Dark Grey
  '80-19093': 'P93',   // Blueberry Cream
  '80-19096': 'P96',   // Cranapple
  '80-19097': 'P97',   // Prickly Pear
  '80-19098': 'P98',   // Sand
  '80-15961': 'P961',  // Cherry
  '80-15179': 'P179',  // Evergreen
  '80-15181': 'P181',  // Light Grey
  '80-15182': 'P182',  // Lavender
  '80-15199': 'P199',  // Shamrock
  '80-15200': 'P200',  // Cobalt
  '80-15201': 'P201',  // Midnight
  '80-15202': 'P202',  // Robin's Egg
  '80-15203': 'P203',  // Flamingo
  '80-15204': 'P204',  // Salmon
  '80-15205': 'P205',  // Fawn
  '80-15206': 'P206',  // Pewter
  '80-15207': 'P207',  // Charcoal
  '80-15208': 'P208',  // Toasted Marshmallow
  '80-15210': 'P210',  // Orchid
  '80-15211': 'P211',  // Tomato
  '80-15212': 'P212',  // Spice
  '80-15213': 'P213',  // Apricot
  '80-15214': 'P214',  // Sherbet
  '80-15215': 'P215',  // Mist
  '80-15216': 'P216',  // Sky
  '80-15217': 'P217',  // Lagoon
  '80-15218': 'P218',  // Teal
  '80-15219': 'P219',  // Fern
  '80-15220': 'P220',  // Olive
  '80-15239': 'P239',  // Mocha
  '80-15240': 'P240',  // Mint
  '80-15241': 'P241',  // Sour Apple
  '80-15242': 'P242',  // Cotton Candy
  '80-15243': 'P243',  // Grape
  '80-15244': 'P244',  // Rose
  '80-15245': 'P245',  // Iris
  '80-15246': 'P246',  // Tangerine
  '80-15247': 'P247',  // Forest
  '80-15248': 'P248',  // Eggplant
  '80-15249': 'P249',  // Honey
  '80-15250': 'P250',  // Gingerbread
  '80-15251': 'P251',  // Thistle
  '80-15252': 'P252',  // Slate Blue
  '80-15253': 'P253',  // Sage
  '80-15254': 'P254',  // Orange Cream
  '80-15255': 'P255',  // Fruit Punch
  '80-15256': 'P256',  // Fuchsia
  '80-15257': 'P257',  // Mulberry
  '80-15258': 'P258',  // Slime
  '80-15259': 'P259',  // Stone
  '80-15260': 'P260',  // Dark Spruce
  '80-15261': 'P261',  // Cocoa
  '80-15262': 'P262',  // Slate Blue (denim)
  '80-15265': 'P265',  // Twilight Plum
  '80-15266': 'P266',  // Caribbean Sea
  '80-15267': 'P267',  // Frosted Lilac
  '80-15268': 'P268',  // Sunflower
  '80-15269': 'P269',  // Lemon
  '80-15270': 'P270',  // ??? (need to verify)
  '80-15272': 'P272',  // Coral
  '80-15273': 'P273',  // Brick
  '80-15274': 'P274',  // Rich Butter
  '80-15275': 'P275',  // Peacock
  '80-15276': 'P276',  // Carnation Pink
  '80-14110': 'P208',  // Toasted Marshmallow (Perler Mini product code)
  '80-15089': 'P89',   // Neon Blue
  '80-15263': 'P263',  // Celery
};

const BRANDS = [
  { id: 'Perler', file: 'perler.gpl', displayName: 'Perler', isPerler: true },
  { id: 'Perler Mini', file: 'perler-mini.gpl', displayName: 'Perler Mini', isPerler: true },
  { id: 'Hama Midi', file: 'hama-midi.gpl', displayName: 'Hama Midi', isPerler: false },
  { id: 'Hama Mini', file: 'hama-mini.gpl', displayName: 'Hama Mini', isPerler: false },
  { id: 'Nabbi', file: 'nabbi.gpl', displayName: 'Nabbi', isPerler: false },
  { id: 'Artkal S', file: 'artkal-s.gpl', displayName: 'Artkal S', isPerler: false },
  { id: 'Artkal C', file: 'artkal-c.gpl', displayName: 'Artkal C', isPerler: false },
];

function parseGplWithMeta(text) {
  const lines = text.split(/\r?\n/);
  const colors = [];
  const meta = { brand: null, codeMap: {} };
  let lastColorKey = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# META:')) {
      const content = trimmed.substring(7).trim();
      const eqIndex = content.indexOf('=');
      if (eqIndex > 0) {
        const key = content.substring(0, eqIndex).trim();
        const value = content.substring(eqIndex + 1).trim();
        if (key === 'brand') meta.brand = value;
      }
      continue;
    }

    if (trimmed.startsWith('# CODE:')) {
      const code = trimmed.substring(7).trim();
      if (lastColorKey) meta.codeMap[lastColorKey] = code;
      continue;
    }

    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('gimp palette') || trimmed.toLowerCase().startsWith('name:') || trimmed.toLowerCase().startsWith('columns:')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        colors.push([r, g, b]);
        lastColorKey = `${r},${g},${b}`;
      }
    }
  }
  return { colors, meta };
}

function convertPerlerCodeMap(codeMap) {
  const newCodeMap = {};
  let unmapped = 0;
  for (const [key, sku] of Object.entries(codeMap)) {
    const pNumber = PERLER_SKU_TO_PNUMBER[sku];
    if (pNumber) {
      newCodeMap[key] = pNumber;
    } else {
      // Fallback: try to extract a short code
      const match = sku.match(/(\d+)$/);
      const fallback = match ? match[1] : sku;
      console.warn(`  No P-number mapping for SKU ${sku}, using fallback "${fallback}"`);
      newCodeMap[key] = fallback;
      unmapped++;
    }
  }
  if (unmapped > 0) {
    console.warn(`  ${unmapped} colors had no P-number mapping`);
  }
  return newCodeMap;
}

// Process each brand
for (const brand of BRANDS) {
  const gplPath = path.join(INPUT_DIR, brand.file);
  if (!fs.existsSync(gplPath)) {
    console.warn(`Missing: ${gplPath}`);
    continue;
  }

  const text = fs.readFileSync(gplPath, 'utf8');
  const { colors, meta } = parseGplWithMeta(text);

  let finalCodeMap = meta.codeMap;
  if (brand.isPerler && Object.keys(meta.codeMap).length > 0) {
    console.log(`Converting ${brand.id} SKUs to P-numbers...`);
    finalCodeMap = convertPerlerCodeMap(meta.codeMap);
  }

  const json = {
    id: brand.id,
    displayName: brand.displayName,
    colors,
    meta: {
      brand: meta.brand || brand.id,
      source: 'https://github.com/maxcleme/beadcolors',
      codeMap: finalCodeMap,
    },
  };

  const outPath = path.join(OUTPUT_DIR, brand.file.replace('.gpl', '.json'));
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`${brand.id}: ${colors.length} colors, ${Object.keys(finalCodeMap).length} codes → ${outPath}`);
}

// Create package.json
const packageJson = {
  name: 'bead-palettes',
  displayName: 'Fuse Bead Palettes',
  description: 'Color palettes for popular fuse bead brands',
  version: '1.0',
  contributes: {
    palettes: BRANDS.map(b => ({
      id: b.id,
      path: `./${b.file.replace('.gpl', '.json')}`,
    })),
  },
};
fs.writeFileSync(path.join(OUTPUT_DIR, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8');
console.log('\npackage.json created');