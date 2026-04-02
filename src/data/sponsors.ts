export interface SponsorDiscount {
  description: string;
}

export interface Sponsor {
  name: string;
  logo: string;
  url: string;
  description: string;
  discounts: SponsorDiscount[];
}

/**
 * Sponsor data for EsteBike.
 *
 * Sponsors are displayed in the order listed below.
 *
 * To add a new sponsor:
 * 1. Place the logo in /public/images/sponsors/ (recommended: 400×200 PNG/SVG)
 * 2. Add an entry below with name, logo path, url, description, and discounts
 */
export const sponsors: Sponsor[] = [
  {
    name: 'Ristorante Leon d\'Oro',
    logo: '/images/sponsors/leon-doro.jpg',
    url: 'https://www.leondoroeste.it',
    description:
      'Albergo ristorante storico di Este, sede sociale di EsteBike e punto di ritrovo per la cena settimanale del martedì.',
    discounts: [
      { description: '10% sul menù alla carta per i soci' },
    ],
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
  },
  {
    name: 'Estodent',
    logo: '/images/sponsors/estodent.png',
    url: 'http://www.estodent.it',
    description:
      'Laboratorio odontotecnico con sede a Este, specializzato in protesi fissa, mobile e su impianti con tecnologia CAD-CAM e materiali di ultima generazione.',
    discounts: [],
  },
  {
    name: 'Obiettivo Casa',
    logo: '/images/sponsors/obiettivo-casa.png',
    url: 'https://www.obiettivo-casa.info',
    description:
      'Agenzia immobiliare di riferimento a Este e Ospedaletto Euganeo, con oltre 20 anni di esperienza nella compravendita e locazione di immobili residenziali e commerciali.',
    discounts: [],
  },
  {
    name: 'Panificio Chiodarelli',
    logo: '/images/sponsors/panificio-chiodarelli.png',
    url: 'https://www.facebook.com/people/Panificio-Chiodarelli/100063598359420/',
    description:
      'Storico panificio artigianale di Este, rinomato per il pane fresco e gli schissotti. In Via Cavour 33, punto di riferimento per gli estesi.',
    discounts: [],
  },
  {
    name: 'Vittoria Assicurazioni Este',
    logo: '/images/sponsors/vittoria-assicurazioni.svg',
    url: 'https://www.agenzievittoria.com/este/',
    description:
      'Agenzia assicurativa Vittoria a Este, offre soluzioni personalizzate per auto, casa, famiglia, risparmio e protezione legale.',
    discounts: [],
  },
  {
    name: 'THZ Informatica',
    logo: '/images/sponsors/thz-informatica.png',
    url: 'https://www.thzinformatica.it',
    description:
      'Vendita di prodotti Apple e Samsung ricondizionati, riparazione smartphone, PC e Mac. Laboratorio interno con sede a Este.',
    discounts: [],
  },
];
