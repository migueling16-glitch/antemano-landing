// ─────────────────────────────────────────────────────────────────────────────
// Yasuko Durango — Menú de alimentos (fuente: carta oficial de Durango)
// Precios incluyen IVA. El gramaje corresponde al total del platillo en crudo.
// ─────────────────────────────────────────────────────────────────────────────

export type Tag = 'destacado' | 'picante' | 'vegetariano' | 'crudo';

export interface Platillo {
  nombre: string;
  desc?: string;
  precio: string;
  tags?: Tag[];
}

export interface Categoria {
  slug: string;
  titulo: string;
  nota?: string;
  platillos: Platillo[];
}

export const MENU: Categoria[] = [
  {
    slug: 'entradas-frias',
    titulo: 'Entradas frías',
    platillos: [
      { nombre: 'Seaweed Salad con Cangrejo', precio: '$179', desc: 'Lechuga sangría, alga preparada, aderezo cítrico, kanikama y tomate cherry.' },
      { nombre: 'Ensalada Yasu', precio: '$169', desc: 'Espinaca, tomate cherry salteado, poro crunchy, dry miso, queso parmesano y vinagreta de yuzu.', tags: ['vegetariano'] },
      { nombre: 'Battera Atún o Salmón', precio: '$229', desc: 'Arroz prensado con aguacate, atún o salmón flameado con spicy mayo y chile serrano.', tags: ['crudo', 'picante'] },
      { nombre: 'Pajaritos (4)', precio: '$209', desc: 'Cangrejo spicy y aguacate, envueltos en láminas de atún y/o salmón.', tags: ['crudo', 'picante'] },
      { nombre: 'Tostadas (2)', precio: '$209', desc: 'Atún, salmón o hamachi con aguacate, spicy mayo, cebollín frito y salsa macha.', tags: ['crudo'] },
      { nombre: 'Crispy Rice (4)', precio: '$209', desc: 'Cubos de arroz crujiente con tartar de atún y/o salmón.', tags: ['destacado', 'crudo'] },
      { nombre: 'Tataki de Res', precio: '$239', desc: 'Res sellada con coles de Bruselas, aderezo de trufa y ponzu.', tags: ['destacado'] },
    ],
  },
  {
    slug: 'entradas-calientes',
    titulo: 'Entradas calientes',
    platillos: [
      { nombre: 'Edamames al Vapor', precio: '$129', tags: ['vegetariano'] },
      { nombre: 'Edamames Spicy', precio: '$159', tags: ['vegetariano', 'picante'] },
      { nombre: 'Edamames al Ajo', precio: '$159', tags: ['vegetariano'] },
      { nombre: 'Gyozas', precio: '$199', desc: 'Rellenas de carne de cerdo, al vapor y selladas al sartén.' },
      { nombre: 'Camarones Melón', precio: '$269', desc: 'Camarones tempura, aderezo cremoso ligeramente dulce, nuez caramelizada y perlas de melón.', tags: ['destacado'] },
      { nombre: 'Firecracker Cauliflower', precio: '$219', desc: 'Palomitas de coliflor con salsa spicy.', tags: ['vegetariano', 'picante'] },
      { nombre: 'Shishito Peppers', precio: '$169', desc: 'Pimientos orientales salteados al wok. Disponibles en temporada.', tags: ['vegetariano'] },
      { nombre: 'Vegetales Tempura', precio: '$159', tags: ['vegetariano'] },
      { nombre: 'Brochetas de Pork Belly (2)', precio: '$169', desc: 'Pork belly en salsa de curry.' },
      { nombre: 'Salmón Teriyaki', precio: '$349', desc: 'Salmón en salsa teriyaki, con guarnición de coliflor y coles de Bruselas.' },
    ],
  },
  {
    slug: 'sopas',
    titulo: 'Sopas',
    platillos: [
      { nombre: 'Sopa Miso', precio: '$89', desc: 'Tofu, alga wakame y cebollín.' },
      { nombre: 'Ramen', precio: '$259', desc: 'Fondo mixto de pollo y cerdo, fideos de trigo, panceta, huevo marinado, naruto, espinaca y cebollín.', tags: ['destacado'] },
      { nombre: 'Ramen Miso', precio: '$269', desc: 'Fondo de pollo y cerdo con base de miso picante, fideos de trigo, panceta, germinado de soya, cebollín y mantequilla.', tags: ['picante'] },
    ],
  },
  {
    slug: 'yakimeshi',
    titulo: 'Yakimeshi',
    nota: 'Arroz frito al wok.',
    platillos: [
      { nombre: 'Yakimeshi Verduras', precio: '$179', desc: 'Arroz frito con verduras.', tags: ['vegetariano'] },
      { nombre: 'Yakimeshi Camarón', precio: '$269', desc: 'Arroz frito con verduras y camarón.' },
      { nombre: 'Yakimeshi Filete', precio: '$269', desc: 'Arroz frito con verduras y filete de res.' },
      { nombre: 'Yakimeshi Mixto', precio: '$289', desc: 'Arroz frito con verduras, camarón y filete de res.' },
      { nombre: 'Yakimeshi Chazu', precio: '$269', desc: 'Arroz frito con pork belly y cebollín.' },
      { nombre: 'Arroz Gohan', precio: '$59', tags: ['vegetariano'] },
    ],
  },
  {
    slug: 'donburi',
    titulo: 'Donburi',
    nota: 'Tazones de arroz.',
    platillos: [
      { nombre: 'Donburi Atún', precio: '$219', desc: 'Tazón de arroz, atún, cebollín y aguacate.', tags: ['crudo'] },
      { nombre: 'Donburi Chutoro', precio: '$259', desc: 'Tazón de arroz, chutoro, cebollín y aguacate.', tags: ['crudo'] },
      { nombre: 'Donburi Toro', precio: '$299', desc: 'Tazón de arroz, toro, cebollín y aguacate.', tags: ['crudo'] },
      { nombre: 'Donburi Salmón', precio: '$219', desc: 'Tazón de arroz, salmón, cebollín y aguacate.', tags: ['crudo'] },
      { nombre: 'Donburi Spicy Mayo Atún o Salmón', precio: '$219', desc: 'Tazón de arroz, atún o salmón, spicy mayo, cebollín y aguacate.', tags: ['crudo', 'picante'] },
    ],
  },
  {
    slug: 'nigiris',
    titulo: 'Nigiris',
    nota: 'Por pieza.',
    platillos: [
      { nombre: 'Atún', precio: '$65', tags: ['crudo'] },
      { nombre: 'Chutoro', precio: '$79', tags: ['crudo'] },
      { nombre: 'Toro', precio: '$85', tags: ['crudo'] },
      { nombre: 'Salmón', precio: '$65', tags: ['crudo'] },
      { nombre: 'Anguila', precio: '$65' },
      { nombre: 'Pesca Blanca', precio: '$54', tags: ['crudo'] },
      { nombre: 'Hamachi', precio: '$54', tags: ['crudo'] },
      { nombre: 'Hueva de Salmón', precio: '$89', tags: ['crudo'] },
      { nombre: 'Negitoro', precio: '$85', tags: ['crudo'] },
    ],
  },
  {
    slug: 'sashimi',
    titulo: 'Sashimi tradicional',
    platillos: [
      { nombre: 'Akami', precio: '$289', desc: '100 g', tags: ['crudo'] },
      { nombre: 'Toro', precio: '$499', desc: '100 g', tags: ['crudo', 'destacado'] },
      { nombre: 'Chutoro', precio: '$359', desc: '100 g', tags: ['crudo'] },
      { nombre: 'Salmón', precio: '$299', desc: '100 g', tags: ['crudo'] },
      { nombre: 'Hamachi', precio: '$289', desc: '100 g', tags: ['crudo'] },
      { nombre: 'Pesca Blanca', precio: '$289', desc: '100 g', tags: ['crudo'] },
      { nombre: 'Maguro Mixto', precio: '$399', desc: '120 g', tags: ['crudo'] },
      { nombre: 'Sashimi Mixto', precio: '$369', desc: '120 g', tags: ['crudo'] },
    ],
  },
  {
    slug: 'tiraditos',
    titulo: 'Tiraditos',
    platillos: [
      { nombre: 'Atún o Salmón Serrano Ponzu', precio: '$299', desc: 'Corte fino de atún o salmón, salsa ponzu, chile serrano y spicy mayo.', tags: ['crudo', 'picante'] },
      { nombre: 'Hamachi', precio: '$299', desc: 'Corte fino de hamachi, flameado con aceite de ajonjolí y ponzu.', tags: ['crudo'] },
      { nombre: 'Pesca Blanca Cítrica', precio: '$299', desc: 'Corte fino de pesca blanca, emulsión de yuzu, ajo frito y yuzu kosho.', tags: ['crudo'] },
    ],
  },
  {
    slug: 'rollos',
    titulo: 'Rollos',
    platillos: [
      { nombre: 'Maguro Trufa Roll', precio: '$219', desc: 'Atún, flakes de tempura, aderezo de trufa, aguacate y ajonjolí.', tags: ['crudo'] },
      { nombre: 'Spicy Tuna / Spicy Salmon Roll', precio: '$219', desc: 'Atún o salmón, sriracha, rayu, aguacate y alga por fuera.', tags: ['crudo', 'picante'] },
      { nombre: 'Trufa Hamachi Roll', precio: '$239', desc: 'Hamachi y aguacate por dentro. Aderezo de trufa, poro crunchy y tobiko negro por fuera.', tags: ['crudo'] },
      { nombre: 'Crunchy Callo', precio: '$259', desc: 'Camarón tempura, atún y aguacate por dentro. Callo, jalapeño sellado con spicy mayo y pimienta por fuera.', tags: ['picante'] },
      { nombre: 'Yasuko Roll', precio: '$239', desc: 'Kanikama spicy, pepino y aguacate por dentro. Hamachi, spicy mayo, salsa de anguila, crunchy tempura, chile serrano, tobiko y cebollín por fuera.', tags: ['destacado', 'crudo', 'picante'] },
      { nombre: 'Dragón Roll', precio: '$239', desc: 'Camarón tempura, queso crema y pepino por dentro. Aguacate, salsa de anguila con spicy mayo y zanahoria frita por fuera.' },
      { nombre: 'Hot Roll', precio: '$249', desc: 'Salmón, camarón tempura y espárrago por dentro. Camarón cocido con spicy mayo, alga rallada, furikake, quinoa inflada y salsa de anguila por fuera.' },
      { nombre: 'Anguila Unagi Especial', precio: '$249', desc: 'Anguila con foie gras flameado por fuera. Flakes de tempura, aderezo de trufa y aguacate por dentro.', tags: ['destacado'] },
      { nombre: 'Okinawa Chutoro', precio: '$249', desc: 'Chutoro y cebolla frita con spicy trufado por dentro, forrado de aguacate, punto de sriracha y cebollín.', tags: ['crudo', 'picante'] },
      { nombre: 'Jalapeño Roll', precio: '$239', desc: 'Atún sellado y aguacate por dentro. Tobiko, jalapeño, cebolla frita y spicy mayo por fuera.', tags: ['picante'] },
      { nombre: 'Soft Shell Crab', precio: '$249', desc: 'Soft shell crab, cangrejo, aguacate, pepino, tobiko y spicy mayo.' },
      { nombre: 'Everest Roll', precio: '$239', desc: 'Atún y aguacate por dentro. Camarón tempura flameado con spicy mayo, cebollín, tobiko y salsa de anguila por fuera.', tags: ['destacado', 'crudo'] },
      { nombre: 'Futo Maguro', precio: '$249', desc: 'Tres partes de atún —akami, chutoro y toro— con cebollín y tacuan.', tags: ['crudo'] },
      { nombre: 'Rainbow', precio: '$229', desc: 'Pesca blanca, salmón y aguacate por dentro. Atún, nikiri y cebollín por fuera.', tags: ['crudo'] },
      { nombre: 'Lemon Salmón Roll', precio: '$219', desc: 'Espárrago y aguacate por dentro. Salmón, limón amarillo, yuzu kosho, sal negra, dry miso y spicy mayo por fuera.', tags: ['crudo'] },
    ],
  },
  {
    slug: 'hand-rolls',
    titulo: 'Hand rolls',
    platillos: [
      { nombre: 'Tuna o Salmón Spicy Mayo', precio: '$125', desc: 'Atún o salmón, mayo y aguacate.', tags: ['crudo'] },
      { nombre: 'Maguro Trufa', precio: '$125', desc: 'Atún con aderezo de trufa, flakes de tempura y aguacate.', tags: ['crudo'] },
      { nombre: 'Negitoro', precio: '$179', desc: 'Belly de atún, cebollín y wasabi.', tags: ['crudo'] },
      { nombre: 'Salmón Ikura', precio: '$169', desc: 'Salmón con hueva de salmón.', tags: ['crudo'] },
      { nombre: 'Tuna o Salmón Spicy', precio: '$125', desc: 'Atún o salmón, spicy rayu, sriracha y aguacate.', tags: ['crudo', 'picante'] },
    ],
  },
  {
    slug: 'hoso-maki',
    titulo: 'Hoso maki',
    nota: 'Rollos tradicionales de 6 piezas.',
    platillos: [
      { nombre: 'Tekka', precio: '$169', desc: 'Atún.', tags: ['crudo'] },
      { nombre: 'Salmón Maki', precio: '$169', tags: ['crudo'] },
      { nombre: 'Kappa Maki', precio: '$125', desc: 'Pepino.', tags: ['vegetariano'] },
      { nombre: 'Negitoro Maki', precio: '$179', desc: 'Belly de atún, cebollín y wasabi.', tags: ['crudo'] },
      { nombre: 'Hamachi Maki', precio: '$169', tags: ['crudo'] },
      { nombre: 'Sésamo Maki', precio: '$179', desc: 'Camarón tempura, aguacate, chile serrano, spicy mayo, cebollín y vinagreta de ajonjolí-yuzu.', tags: ['picante'] },
    ],
  },
];

export const NOTAS = [
  'Como manejamos productos frescos, algunos de nuestros platillos podrían no estar disponibles.',
  'El gramaje corresponde al total del platillo en crudo.',
  'Todos nuestros precios incluyen IVA.',
  'El consumo de alimentos crudos es responsabilidad de quien los consume.',
];

export const TAG_LABEL: Record<Tag, string> = {
  destacado: 'Especialidad',
  picante: 'Picante',
  vegetariano: 'Vegetariano',
  crudo: 'Crudo',
};
