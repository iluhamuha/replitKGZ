import { db, tripsTable, tripDatesTable } from "@workspace/db";
import { logger } from "./lib/logger";

const TRIPS = [
  {
    id: 1,
    name: "Tian Shan — Srdce hor",
    destination: "Bishkek — Karakol — Jezero Issyk-Kul",
    description:
      "Epický 12denní trek skrze Tian Shan — Nebeské hory. Projdeme kaňony Konorchek, překonáme průsmyk Ala-Köl (3860 m n.m.), koupeme se v horském jezeře Issyk-Kul a strávíme noci v nomádských jurtách. Zájezd je vhodný pro turisty se základní kondicí. Cena zahrnuje letenky z Prahy, ubytování, průvodce a stravování.",
    priceCzk: "62000.00",
    days: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80",
    availableSpots: 8,
    active: true,
    priceIncludes:
      "Letenky Praha–Biškek zpáteční\nUbytování v jurtech a hotelech\nPrůvodce po celou dobu zájezdu\nStravování (snídaně + večeře)\nVšechny vnitrostátní transfery\nVstupné do národních parků\nPůjčení trekkingového vybavení",
    priceExcludes:
      "Cestovní pojištění\nVízum do Kyrgyzstánu\nOsobní výdaje a suvenýry\nObědy\nSpropitné pro průvodce",
  },
  {
    id: 2,
    name: "Pamir Highway — Konec světa",
    destination: "Osh — Sary-Tash — Karakul",
    description:
      "Dobrodružná jeepová expedice po legendární Pamírské dálnici. Jedeme přes 4655 m vysoký průsmyk Ak-Baital, kolem opuštěného jezera Karakul s výhledem na Pik Lenin (7134 m), skrze rokliny a kamenité stepě. 10 dní na střeše světa — jen hory, hvězdy a nomádi. Vhodné pro dobrodruhy bez zábrany.",
    priceCzk: "55000.00",
    days: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1563906267088-b029e7101114?w=800&q=80",
    availableSpots: 6,
    active: true,
    priceIncludes:
      "Letenky Praha–Biškek zpáteční\nUbytování (jurtové tábory + guesthousy)\nPrůvodce a zkušený instruktor\nVšechna jídla po dobu výpravy\nKoně a jezdečtí instruktoři\nVeškeré vnitrostátní dopravy\nStanové vybavení",
    priceExcludes:
      "Cestovní pojištění\nVízum do Kyrgyzstánu (cca 500 Kč)\nOsobní výdaje\nAlkohol\nSpropitné",
  },
  {
    id: 3,
    name: "Nomádský Kyrgyzstán",
    destination: "Bishkek — Song-Köl — Kochkor",
    description:
      "Kulturní ponoření do života kyrgyzských nomádů. Přesuneme se na horskohorské pastviny kolem jezera Song-Köl (3016 m), naučíme se výrobu plsti, jízdu na koni, vaření šurpy. Večery u ohně v jurtě, ranní mlhy nad jezerem, stáda koní na obzoru. Ideální pro ty, kdo chtějí víc než jen turistiku — zážitek ze způsobu života.",
    priceCzk: "38000.00",
    days: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80",
    availableSpots: 10,
    active: true,
    priceIncludes:
      "Letenky Praha–Biškek zpáteční\nUbytování v kempu a guesthouse\nSnídaně a večeře každý den\nZkušený místní průvodce\nJízda na koni s instruktorem\nVýroba plsti — workshop\nVšechny vnitrostátní transfery",
    priceExcludes:
      "Cestovní pojištění\nVízum do Kyrgyzstánu\nOsobní výdaje a suvenýry\nObědy\nSpropitné",
  },
];

const TRIP_DATES = [
  { tripId: 1, departureDate: "2026-06-14", returnDate: "2026-06-26", availableSpots: 8, notes: null },
  { tripId: 1, departureDate: "2026-07-19", returnDate: "2026-07-31", availableSpots: 6, notes: "Možno prodloužení o 3 dny" },
  { tripId: 1, departureDate: "2026-08-22", returnDate: "2026-09-03", availableSpots: 10, notes: null },
  { tripId: 2, departureDate: "2026-06-28", returnDate: "2026-07-08", availableSpots: 5, notes: null },
  { tripId: 2, departureDate: "2026-08-09", returnDate: "2026-08-19", availableSpots: 8, notes: null },
  { tripId: 3, departureDate: "2026-07-05", returnDate: "2026-07-13", availableSpots: 12, notes: null },
  { tripId: 3, departureDate: "2026-09-06", returnDate: "2026-09-14", availableSpots: 10, notes: null },
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select().from(tripsTable).limit(1);
  if (existing.length > 0) {
    return;
  }

  logger.info("Production database is empty — seeding initial trip data");

  for (const trip of TRIPS) {
    await db.insert(tripsTable).values(trip).onConflictDoNothing();
  }

  for (const date of TRIP_DATES) {
    await db
      .insert(tripDatesTable)
      .values({
        tripId: date.tripId,
        departureDate: date.departureDate,
        returnDate: date.returnDate,
        availableSpots: date.availableSpots,
        notes: date.notes,
      })
      .onConflictDoNothing();
  }

  logger.info({ trips: TRIPS.length, dates: TRIP_DATES.length }, "Seed complete");
}
