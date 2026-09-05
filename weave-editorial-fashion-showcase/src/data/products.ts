import m1 from "@/assets/m1.jpg";
import m2 from "@/assets/m2.jpg";
import m3 from "@/assets/m3.jpg";
import m4 from "@/assets/m4.jpg";
import m5 from "@/assets/m5.jpg";
import m6 from "@/assets/m6.jpg";
import w1 from "@/assets/w1.jpg";
import w2 from "@/assets/w2.jpg";
import w3 from "@/assets/w3.jpg";
import w4 from "@/assets/w4.jpg";
import w5 from "@/assets/w5.jpg";
import w6 from "@/assets/w6.jpg";

export type Category = "men" | "women";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  tagline: string;
  description: string;
  material: string;
  care: string;
  colors: string[];
  sizes: string[];
  badge?: string;
};

export const products: Product[] = [
  {
    id: "atelier-linen-shirt",
    name: "Atelier Oversized Linen Shirt",
    category: "men",
    price: 899,
    image: m1,
    tagline: "Softened ecru linen, cut generously",
    description:
      "An easy, oversized shirt in garment-washed linen. Dropped shoulders, a single patch pocket and a collar that sits just right open or buttoned.",
    material: "100% European flax linen, 165 gsm",
    care: "Machine wash cold, line dry, warm iron",
    colors: ["Ecru", "Clay", "Sand"],
    sizes: ["XS", "S", "M", "L", "XL"],
    badge: "New",
  },
  {
    id: "kiln-knit-polo",
    name: "Kiln Ribbed Knit Polo",
    category: "men",
    price: 999,
    image: m2,
    tagline: "Terracotta rib, hand-finished collar",
    description:
      "A heavyweight rib polo knitted in the same mill we have used since our first collection. Deep terracotta, three horn buttons.",
    material: "80% merino wool, 20% cotton",
    care: "Hand wash cold, dry flat",
    colors: ["Terracotta", "Olive", "Chalk"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "studio-pleated-trouser",
    name: "Studio Pleated Trouser",
    category: "men",
    price: 799,
    image: m3,
    tagline: "Double-pleat, wide leg, sand twill",
    description:
      "Tailored with a high rise and a fluid wide leg. Built to be worn from studio to dinner without a second thought.",
    material: "Cotton-wool twill",
    care: "Dry clean recommended",
    colors: ["Sand", "Charcoal"],
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    id: "ember-corduroy-overshirt",
    name: "Ember Corduroy Overshirt",
    category: "men",
    price: 899,
    image: m4,
    tagline: "8-wale cord in burnt rust",
    description:
      "Somewhere between a shirt and a jacket. Two chest pockets, antique brass buttons, and a body that softens with every wear.",
    material: "100% organic cotton corduroy",
    care: "Machine wash cold, tumble low",
    colors: ["Rust", "Moss"],
    sizes: ["S", "M", "L", "XL"],
    badge: "Best seller",
  },
  {
    id: "everyday-heavy-tee",
    name: "Everyday Heavy Tee",
    category: "men",
    price: 599,
    image: m5,
    tagline: "The 240gsm foundation piece",
    description:
      "A dense, opaque cotton tee with a ribbed neck that holds its shape. The one you will replace three of.",
    material: "100% long-staple cotton, 240 gsm",
    care: "Machine wash cold",
    colors: ["Chalk", "Clay", "Charcoal"],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "camel-unstructured-blazer",
    name: "Camel Unstructured Blazer",
    category: "men",
    price: 999,
    image: m6,
    tagline: "Soft shoulder, full canvas ease",
    description:
      "Unlined through the body with a natural shoulder, so it wears like a cardigan and reads like tailoring.",
    material: "Wool-cashmere blend",
    care: "Dry clean only",
    colors: ["Camel", "Ink"],
    sizes: ["36", "38", "40", "42", "44"],
  },
  {
    id: "dune-slip-dress",
    name: "Dune Bias Slip Dress",
    category: "women",
    price: 899,
    image: w1,
    tagline: "Cut on the bias, falls like water",
    description:
      "A floor-skimming slip in a warm cream with adjustable straps and a subtle side slit. Weightless, but never sheer.",
    material: "Cupro-viscose blend",
    care: "Hand wash cold, dry flat",
    colors: ["Cream", "Clay"],
    sizes: ["XS", "S", "M", "L"],
    badge: "New",
  },
  {
    id: "sienna-wrap-blouse",
    name: "Sienna Linen Wrap Blouse",
    category: "women",
    price: 699,
    image: w2,
    tagline: "Tie waist, three-quarter sleeve",
    description:
      "A true wrap with a self-tie waist that lets you set the shape. Washed linen in our signature sienna.",
    material: "100% washed linen",
    care: "Machine wash cold, line dry",
    colors: ["Sienna", "Ecru", "Sage"],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "meridian-wide-trouser",
    name: "Meridian Wide-Leg Trouser",
    category: "women",
    price: 799,
    image: w3,
    tagline: "High rise, belted, floor-grazing",
    description:
      "A generous wide leg with a defined waist and covered belt. Drapes long over a heel, rolls easily over a flat.",
    material: "Tencel-cotton twill",
    care: "Machine wash cold, warm iron",
    colors: ["Camel", "Chalk", "Ink"],
    sizes: ["24", "26", "28", "30", "32"],
    badge: "Best seller",
  },
  {
    id: "hearth-ribbed-cardigan",
    name: "Hearth Ribbed Cardigan",
    category: "women",
    price: 899,
    image: w4,
    tagline: "Oatmeal chunky rib, patch pockets",
    description:
      "An oversized cardigan with a shawl-adjacent collar and deep pockets. Made to be lived in through shoulder season.",
    material: "Lambswool-cotton rib knit",
    care: "Hand wash cold, dry flat",
    colors: ["Oatmeal", "Rust"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: "flare-pleated-skirt",
    name: "Flare Pleated Maxi Skirt",
    category: "women",
    price: 849,
    image: w5,
    tagline: "Knife pleats in deep rust",
    description:
      "Hundreds of pressed pleats that move as one. A banded waist keeps the volume where it belongs.",
    material: "Recycled polyester georgette",
    care: "Machine wash cold, hang dry",
    colors: ["Rust", "Bone"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: "harbor-trench-coat",
    name: "Harbor Oversized Trench",
    category: "women",
    price: 999,
    image: w6,
    tagline: "Double-breasted, storm-flap classic",
    description:
      "A relaxed take on the trench with a dropped shoulder and a belt you can knot or ignore. Water-resistant cotton gabardine.",
    material: "Cotton gabardine, water-repellent finish",
    care: "Dry clean only",
    colors: ["Ecru", "Stone"],
    sizes: ["XS", "S", "M", "L"],
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
