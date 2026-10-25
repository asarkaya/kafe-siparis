// EU-14 Hauptallergene (Lebensmittelinformationsverordnung, LMIV)
export const ALLERGENS = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

// Kennzeichnungspflichtige Zusatzstoffe (übliche Nummerierung auf deutschen Speisekarten)
export const ADDITIVES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
