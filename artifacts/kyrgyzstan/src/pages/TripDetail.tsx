import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetTrip, 
  getGetTripQueryKey,
  useCreateBooking,
  useCreateStripeSession,
  useGetTripGallery,
  BookingInputBookingType,
  BookingInputPaymentMethod
} from "@workspace/api-client-react";
import { MapPin, Calendar, Users, CreditCard, QrCode, Mountain, ArrowLeft, CheckCircle2, Check, X, Images } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  customerEmail: z.string().email("Neplatná e-mailová adresa"),
  customerPhone: z.string().min(9, "Neplatné telefonní číslo").optional().or(z.literal("")),
  bookingType: z.nativeEnum(BookingInputBookingType),
  paymentMethod: z.nativeEnum(BookingInputPaymentMethod),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function TripGallery({ tripId }: { tripId: number }) {
  const { data: photos, isLoading } = useGetTripGallery(tripId);
  const [selected, setSelected] = useState<number | null>(null);

  const list = photos ?? [];

  const handlePrev = () => {
    if (selected === null) return;
    setSelected((selected - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    if (selected === null) return;
    setSelected((selected + 1) % list.length);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Fotogalerie
          </h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="break-inside-avoid">
                <Skeleton className={`w-full rounded-lg ${i % 2 === 0 ? 'h-64' : 'h-48'}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (list.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Fotogalerie
          </h2>
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <Images className="h-12 w-12 mx-auto mb-3 opacity-25" />
            <p className="text-base">Ke středoasijskému dobrodružství připravujeme fotogalerii.</p>
            <p className="text-sm mt-1">Brzy zde uvidíte snímky přímo z trasy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Fotogalerie
          </h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {list.map((photo, i) => (
              <div
                key={photo.id}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => setSelected(i)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white font-semibold text-sm leading-tight">{photo.caption}</p>
                  {photo.location && (
                    <p className="text-gray-300 text-xs mt-1">{photo.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected !== null && list[selected] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "Escape") setSelected(null);
          }}
          tabIndex={0}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2"
            onClick={() => setSelected(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-4xl font-light px-4 py-6 select-none z-10"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-4xl font-light px-4 py-6 select-none z-10"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
          >
            ›
          </button>
          <div
            className="max-w-5xl max-h-[90vh] mx-12 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={list[selected].imageUrl}
              alt={list[selected].caption}
              className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium text-lg">{list[selected].caption}</p>
              {list[selected].location && (
                <p className="text-gray-400 text-sm mt-1">{list[selected].location}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TripDetail() {
  const params = useParams();
  const tripId = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: trip, isLoading, isError } = useGetTrip(tripId, {
    query: {
      enabled: !!tripId,
      queryKey: getGetTripQueryKey(tripId),
    }
  });

  const createBooking = useCreateBooking();
  const createStripeSession = useCreateStripeSession();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingType: BookingInputBookingType.deposit,
      paymentMethod: BookingInputPaymentMethod.card,
    },
  });

  const bookingType = form.watch("bookingType");

  const onSubmit = async (data: BookingFormValues) => {
    if (!trip) return;
    
    setIsSubmitting(true);
    
    try {
      createBooking.mutate(
        { id: trip.id, data },
        {
          onSuccess: (booking) => {
            if (booking.paymentMethod === "card") {
              createStripeSession.mutate(
                { id: booking.id },
                {
                  onSuccess: (session) => {
                    window.location.href = session.url;
                  },
                  onError: () => {
                    setIsSubmitting(false);
                    toast({
                      title: "Chyba platební brány",
                      description: "Nepodařilo se vytvořit relaci pro platbu kartou. Zkuste to prosím znovu.",
                      variant: "destructive",
                    });
                  }
                }
              );
            } else if (booking.paymentMethod === "qr") {
              setLocation(`/payment/qr/${booking.id}`);
            }
          },
          onError: () => {
            setIsSubmitting(false);
            toast({
              title: "Chyba rezervace",
              description: "Při vytváření rezervace došlo k chybě. Zkuste to prosím znovu.",
              variant: "destructive",
            });
          }
        }
      );
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Mountain className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Zájezd nenalezen</h1>
        <p className="text-muted-foreground mb-8">
          Omlouváme se, ale požadovaný zájezd se nepodařilo najít.
        </p>
        <Button asChild>
          <Link href="/">Zpět na přehled zájezdů</Link>
        </Button>
      </div>
    );
  }

  const amountToPay = bookingType === "deposit" && trip.depositAmount 
    ? trip.depositAmount 
    : trip.priceCzk;

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header Banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-secondary">
        <div className="absolute inset-0 bg-black/50 z-10" />
        {trip.imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${trip.imageUrl})` }}
          />
        )}
        <div className="container relative z-20 h-full flex flex-col justify-end pb-12 px-4">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 w-fit transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na přehled
          </Link>
          <div className="flex items-center gap-3 text-primary mb-3">
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-none px-3 py-1">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {trip.destination}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 bg-black/20 backdrop-blur-md px-3 py-1">
              {trip.days} dní
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md max-w-3xl leading-tight">
            {trip.name}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Mountain className="h-6 w-6 text-primary" />
                  O zájezdu
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-foreground text-muted-foreground whitespace-pre-line">
                  {trip.description}
                </div>
                
                {(trip.priceIncludes || trip.priceExcludes) && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {trip.priceIncludes && (
                      <div>
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </span>
                          Cena zahrnuje
                        </h3>
                        <ul className="space-y-2">
                          {trip.priceIncludes.split("\n").filter(Boolean).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              {item.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {trip.priceExcludes && (
                      <div>
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40">
                            <X className="h-3 w-3 text-red-500 dark:text-red-400" />
                          </span>
                          Cena nezahrnuje
                        </h3>
                        <ul className="space-y-2">
                          {trip.priceExcludes.split("\n").filter(Boolean).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                              {item.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 p-6 bg-muted/40 rounded-xl border border-border/40">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Calendar className="h-8 w-8 text-primary mb-3 opacity-80" />
                    <span className="text-sm text-muted-foreground">Délka</span>
                    <span className="font-bold text-lg">{trip.days} dní</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <Users className="h-8 w-8 text-primary mb-3 opacity-80" />
                    <span className="text-sm text-muted-foreground">Volná místa</span>
                    <span className="font-bold text-lg">{trip.availableSpots}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <MapPin className="h-8 w-8 text-primary mb-3 opacity-80" />
                    <span className="text-sm text-muted-foreground">Lokalita</span>
                    <span className="font-bold text-lg">{trip.destination}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="h-8 w-8 text-primary mb-3 opacity-80" />
                    <span className="text-sm text-muted-foreground">Dostupnost</span>
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-500">Aktivní</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Photo Gallery */}
            <TripGallery tripId={trip.id} />
          </div>

          {/* Booking Form Sidebar */}
          <div className="lg:col-span-1 sticky top-24">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-6 border-b border-border/50">
                <CardTitle className="text-2xl">Rezervace</CardTitle>
                <CardDescription className="text-base mt-2">
                  Zajistěte si místo na tomto nezapomenutelném dobrodružství.
                </CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plná cena</span>
                    <span className="font-bold text-xl">{trip.priceCzk.toLocaleString("cs-CZ")} Kč</span>
                  </div>
                  {trip.depositAmount && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Záloha (30%)</span>
                      <span className="font-medium text-foreground">{trip.depositAmount.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Jméno a příjmení</FormLabel>
                            <FormControl>
                              <Input placeholder="Jan Novák" className="bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">E-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="jan.novak@email.cz" type="email" className="bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Telefon <span className="text-muted-foreground font-normal">(nepovinné)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="+420 123 456 789" className="bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Typ platby</h3>
                      <FormField
                        control={form.control}
                        name="bookingType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col gap-3"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-muted/40 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-muted/80 transition-colors">
                                  <FormControl>
                                    <RadioGroupItem value="deposit" id="deposit" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex-1 flex justify-between items-center">
                                    <span>Záloha 30%</span>
                                    <span className="font-medium">{trip.depositAmount?.toLocaleString("cs-CZ")} Kč</span>
                                  </FormLabel>
                                </FormItem>
                                
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-muted/40 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-muted/80 transition-colors">
                                  <FormControl>
                                    <RadioGroupItem value="full" id="full" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer flex-1 flex justify-between items-center">
                                    <span>Plná platba</span>
                                    <span className="font-medium">{trip.priceCzk.toLocaleString("cs-CZ")} Kč</span>
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Platební metoda</h3>
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-3"
                              >
                                <FormItem>
                                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                                    <FormControl>
                                      <RadioGroupItem value="card" className="sr-only" />
                                    </FormControl>
                                    <div className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground transition-all">
                                      <CreditCard className="mb-3 h-6 w-6" />
                                      <span className="font-medium text-sm">Karta</span>
                                    </div>
                                  </FormLabel>
                                </FormItem>
                                
                                <FormItem>
                                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                                    <FormControl>
                                      <RadioGroupItem value="qr" className="sr-only" />
                                    </FormControl>
                                    <div className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground transition-all">
                                      <QrCode className="mb-3 h-6 w-6" />
                                      <span className="font-medium text-sm">QR Platba</span>
                                    </div>
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-lg font-bold shadow-lg" 
                        disabled={isSubmitting || trip.availableSpots <= 0}
                      >
                        {isSubmitting ? "Zpracovávám..." : `Závazně rezervovat (${amountToPay.toLocaleString("cs-CZ")} Kč)`}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-4">
                        Kliknutím souhlasíte se všeobecnými obchodními podmínkami.
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
