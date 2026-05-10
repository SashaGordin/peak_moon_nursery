export type StockItem = {
  id: string;
  name: string;
  variety?: string;
  notes?: string;
  price?: string;
  stock?: number;
  category?: string;
  description?: string;
  mature_height?: string;
  days_to_maturity?: string;
  growth_type?: string;
  image_url?: string | null;
};

export type ComingSoonItem = {
  id: string;
  name: string;
  variety?: string;
  notes?: string;
  eta?: string;
};

export type EventItem = {
  id: string;
  title: string;
  description?: string;
  date: string;
};

export type SiteSettings = {
  hours: string;
  contactEmail: string;
  contactPhone: string;
  stockUpdatedAt: string | null;
};

export type SignupItem = {
  id: string;
  name: string;
  email: string;
  interests?: string;
  createdAt?: string;
};

export const seedData = {
  in_stock: [
    { id: "s1", name: "Cherokee Purple Tomato", variety: "Heirloom · indeterminate", notes: "Smoky, sweet, big slicer. A bench favorite.", price: "$5", stock: 12, category: "Tomato" },
    { id: "s2", name: "Sungold Tomato",          variety: "Cherry · indeterminate",   notes: "Candy-sweet orange cherries. Goes fast.",   price: "$5", stock: 4,  category: "Tomato" },
    { id: "s3", name: "Genovese Basil",          variety: "Classic Italian",          notes: "Full sun, pinch the tops, eat well.",        price: "$4", stock: 24, category: "Herb"   },
    { id: "s4", name: "Lacinato Kale",           variety: "Tuscan / 'dinosaur'",      notes: "Cold-hardy, productive all season.",         price: "$4", stock: 18, category: "Greens" },
    { id: "s5", name: "Marigold 'Queen Sophia'", variety: "Annual flower",            notes: "Cheerful companion for tomatoes.",           price: "$4", stock: 30, category: "Flower" },
    { id: "s6", name: "Costata Romanesco Squash", variety: "Italian zucchini",        notes: "Nutty, ribbed, unbeatable on the grill.",    price: "$5", stock: 6,  category: "Squash" },
  ] as StockItem[],
  coming_soon: [
    { id: "c1", name: "Sweet Peppers", variety: "Several varieties",             notes: "Hardening off now — bench-ready next week.", eta: "Next week" },
    { id: "c2", name: "Hot Peppers",   variety: "Jalapeño, Shishito, Serrano",   notes: "Same wave as sweets.",                       eta: "Next week" },
    { id: "c3", name: "Eggplant",      variety: "Listada de Gandia, Black Beauty", notes: "Loves the warm bench.",                   eta: "Mid-May"   },
    { id: "c4", name: "Cucumbers",     variety: "Marketmore, Lemon",             notes: "Direct-sown coming soon.",                   eta: "Late May"  },
  ] as ComingSoonItem[],
  events: [
    { id: "e1", title: "Open weekend",            description: "Stop by the bench — first big restock of the year.", date: "2026-05-09" },
    { id: "e2", title: "Pepper-day pop-up",       description: "All the heats and sweets, all at once.",            date: "2026-05-16" },
    { id: "e3", title: "Vashon Garden Tour stop", description: "We'll be on the route — come say hi.",              date: "2026-06-13" },
  ] as EventItem[],
  settings: {
    hours: "Saturdays & Sundays, 10am–4pm",
    contactEmail: "",
    contactPhone: "",
    stockUpdatedAt: null,
  } as SiteSettings,
};
