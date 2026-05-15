import { Link } from "wouter";
import { useListTrips, useGetTripDates, type TripDate } from "@workspace/api-client-react";
import { Mountain, MapPin, Clock, ChevronRight, CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function formatShortDate(iso: string) {
  try {
    return format(new Date(iso + "T00:00:00"), "d.M.");
  } catch {
    return iso;
  }
}

function TripDatesPreview({ tripId }: { tripId: number }) {
  const { data: dates, isLoading } = useGetTripDates(tripId);

  if (isLoading) {
    return (
      <div className="flex gap-2 mt-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const future = (dates ?? []).filter((d: TripDate) => {
    try {
      return new Date(d.departureDate + "T00:00:00") >= today;
    } catch {
      return false;
    }
  });

  const visible = future.slice(0, 3);
  const overflow = future.length - visible.length;

  return (
    <div className="mt-5 pt-4 border-t border-border/40">
      <div className="flex items-center gap-1.5 mb-3">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Dostupné termíny
        </span>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Termíny připravujeme — brzy&nbsp;zveřejníme.</p>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          {visible.map((d: TripDate) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <CalendarDays className="h-3 w-3 opacity-70" />
              {formatShortDate(d.departureDate)}
              {d.returnDate && (
                <>
                  <ArrowRight className="h-2.5 w-2.5 opacity-50" />
                  {formatShortDate(d.returnDate)}
                </>
              )}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              +{overflow} {overflow === 1 ? "další" : overflow < 5 ? "další" : "dalších"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: trips, isLoading } = useListTrips();

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="relative w-full h-[75vh] min-h-[560px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/45 z-10" />
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=85"
          alt="Kyrgyzstán hory"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="container relative z-20 text-center text-white px-4">
          <h1 className="font-bold tracking-tight drop-shadow-lg leading-none mb-4">
            <span className="block text-4xl md:text-6xl lg:text-7xl text-white">
              Z Prahy do Kyrgyzstanu.
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl text-primary mt-1">
              Nic víc.
            </span>
          </h1>
          <p className="text-base md:text-lg max-w-lg mx-auto mb-10 text-gray-300 drop-shadow leading-relaxed mt-8">
            Dobrodružné cesty do srdce Tian Shan. Jurty, průsmyky, koně a ticho, které v Praze nenajdete.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-xl px-8" asChild>
              <a href="#zajezdy">Prohlédnout zájezdy</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Trips Section */}
      <section id="zajezdy" className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-border pb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Aktuální zájezdy</h2>
            <p className="text-muted-foreground text-lg">
              Vyberte si své další životní dobrodružství.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border/50">
                <Skeleton className="h-64 w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map(j => <Skeleton key={j} className="h-7 w-20 rounded-full" />)}
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-lg border border-border shadow-sm">
            <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Žádné zájezdy nejsou momentálně k dispozici</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Připravujeme pro vás nová dobrodružství. Zkuste to prosím později.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 border-border/60 bg-card hover:-translate-y-1">
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                  {trip.imageUrl ? (
                    <img
                      src={trip.imageUrl}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Mountain className="h-16 w-16 text-secondary-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm font-semibold">
                      {trip.days} dní
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>
                  <CardTitle className="text-2xl line-clamp-2 leading-tight">{trip.name}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 text-muted-foreground pb-2">
                  <p className="line-clamp-3 mb-5">{trip.description}</p>

                  <div className="space-y-3 bg-muted/50 p-4 rounded-md">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Plná cena</span>
                      <span className="font-semibold text-foreground text-lg">{trip.priceCzk.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                    {trip.depositAmount && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Možnost zálohy</span>
                        <span className="font-medium text-foreground">{trip.depositAmount.toLocaleString("cs-CZ")} Kč</span>
                      </div>
                    )}
                  </div>

                  <TripDatesPreview tripId={trip.id} />
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/50 mt-auto bg-card">
                  <Button asChild className="w-full font-semibold group/btn" size="lg">
                    <Link href={`/trip/${trip.id}`}>
                      Zobrazit detail
                      <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
