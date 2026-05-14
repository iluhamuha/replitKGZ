import { Link } from "wouter";
import { useListTrips } from "@workspace/api-client-react";
import { Mountain, MapPin, Calendar, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
          <p className="text-sm md:text-base uppercase tracking-[0.25em] text-gray-300 mb-5 font-medium">
            Z Prahy do Kyrgyzstanu
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto drop-shadow-lg leading-[1.05]">
            Nic víc.
          </h1>
          <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 text-gray-200 drop-shadow leading-relaxed">
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
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>
                  <CardTitle className="text-2xl line-clamp-2 leading-tight">{trip.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 text-muted-foreground pb-2">
                  <p className="line-clamp-3 mb-6">{trip.description}</p>
                  
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
