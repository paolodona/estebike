export interface SponsorDiscount {
  description: string;
}

export interface Sponsor {
  name: string;
  logo: string;
  url: string;
  description: string;
  discounts: SponsorDiscount[];
  tier: 'gold' | 'silver' | 'bronze';
}

/**
 * Sponsor data for EsteBike.
 *
 * To add a new sponsor:
 * 1. Place the logo in /public/images/sponsors/ (recommended: 400×200 PNG/SVG)
 * 2. Add an entry below with name, logo path, url, description, discounts, and tier
 */
export const sponsors: Sponsor[] = [
  // === GOLD SPONSORS ===
  {
    name: 'Ristorante Leon d\'Oro',
    logo: '/images/sponsors/leon-doro.jpg',
    url: 'https://www.leondoroeste.it',
    description:
      'Albergo ristorante storico di Este, sede sociale di EsteBike e punto di ritrovo per la cena settimanale del martedì.',
    discounts: [
      { description: '10% sul menù alla carta per i soci' },
    ],
    tier: 'gold',
  },
  {
    name: 'Ride X-Treme',
    logo: '/images/sponsors/ride-xtreme.png',
    url: 'https://ridextreme.it',
    description:
      'Ciclofficina multibrand, noleggio e vendita bici, e-bike, MTB, gravel e road bike. Bike fitting biomeccanico, costruzione ruote e diagnostica e-bike nei Colli Euganei e sul Lago di Garda.',
    discounts: [
      { description: '20% su prodotti e servizi per i tesserati EsteBike' },
    ],
    tier: 'gold',
  },
  {
    name: 'Cicli Zordan',
    logo: '/images/sponsors/cicli-zordan.png',
    url: 'https://www.ciclizordan.it',
    description:
      'Il punto di riferimento per i ciclisti di Este e dei Colli Euganei. Vendita, assistenza e riparazione bici da corsa, MTB e e-bike.',
    discounts: [
      { description: '10% su manutenzione e riparazioni' },
      { description: '5% su accessori e abbigliamento' },
      { description: 'Controllo bici stagionale gratuito' },
    ],
    tier: 'gold',
  },
  {
    name: 'Sport & Salute Centro Medico',
    logo: '/images/sponsors/sport-salute.png',
    url: 'https://www.example.com',
    description:
      'Centro medico sportivo specializzato in visite agonistiche, fisioterapia e medicina dello sport.',
    discounts: [
      { description: '15% su visite mediche sportive' },
      { description: '10% su percorsi di fisioterapia' },
    ],
    tier: 'gold',
  },
  {
    name: 'Estodent',
    logo: '/images/sponsors/estodent.png',
    url: 'http://www.estodent.it',
    description:
      'Laboratorio odontotecnico con sede a Este, specializzato in protesi fissa, mobile e su impianti con tecnologia CAD-CAM e materiali di ultima generazione.',
    discounts: [],
    tier: 'gold',
  },
  {
    name: 'Obiettivo Casa',
    logo: '/images/sponsors/obiettivo-casa.png',
    url: 'https://www.obiettivo-casa.info',
    description:
      'Agenzia immobiliare di riferimento a Este e Ospedaletto Euganeo, con oltre 20 anni di esperienza nella compravendita e locazione di immobili residenziali e commerciali.',
    discounts: [],
    tier: 'gold',
  },
  // === SILVER SPONSORS ===
  {
    name: 'Bar Ristorante Al Parco',
    logo: '/images/sponsors/al-parco.png',
    url: 'https://www.example.com',
    description:
      'Ristorante e bar nel cuore di Este, punto di ritrovo per le partenze e gli arrivi delle uscite del club.',
    discounts: [
      { description: '10% sul menù del giorno' },
      { description: 'Caffè omaggio dopo le uscite domenicali' },
    ],
    tier: 'silver',
  },
  {
    name: 'Farmacia Este Centro',
    logo: '/images/sponsors/farmacia-este.png',
    url: 'https://www.example.com',
    description:
      "Farmacia con reparto dedicato a integratori sportivi e prodotti per il benessere dell'atleta.",
    discounts: [
      { description: '15% su integratori sportivi' },
      { description: '10% su prodotti per la cura del corpo' },
    ],
    tier: 'silver',
  },
  {
    name: 'Ottica Vision',
    logo: '/images/sponsors/ottica-vision.png',
    url: 'https://www.example.com',
    description:
      'Ottica specializzata in occhiali sportivi e lenti per ciclismo con protezione UV.',
    discounts: [{ description: '20% su occhiali da ciclismo' }],
    tier: 'silver',
  },
  // === BRONZE SPONSORS ===
  {
    name: 'Panificio Da Mario',
    logo: '/images/sponsors/panificio-mario.png',
    url: 'https://www.example.com',
    description:
      'Panificio artigianale di Este, fornitore ufficiale del Magna & Pedala.',
    discounts: [{ description: '10% su tutti i prodotti da forno' }],
    tier: 'bronze',
  },
  {
    name: 'AutoOfficina Rossi',
    logo: '/images/sponsors/officina-rossi.png',
    url: 'https://www.example.com',
    description:
      'Officina meccanica auto e moto con servizio portabici e trasporto.',
    discounts: [{ description: '10% su tagliando auto' }],
    tier: 'bronze',
  },
];
