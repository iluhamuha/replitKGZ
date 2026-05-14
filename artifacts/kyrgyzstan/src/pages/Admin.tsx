import { useState } from "react";
import { 
  useGetAdminStats, 
  useAdminListTrips, 
  useAdminListBookings,
  useAdminUpdateTrip,
  useAdminCreateTrip,
  useAdminUpdateBookingStatus,
  BookingStatusUpdateStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Map, 
  Plus,
  Pencil,
  MoreVertical,
  Check,
  X
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  Body,
  Cell,
  Head,
  Header,
  Row,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Čeká", variant: "outline" },
  deposit_paid: { label: "Záloha zaplacena", variant: "secondary" },
  fully_paid: { label: "Zaplaceno", variant: "default" },
  cancelled: { label: "Zrušeno", variant: "destructive" },
};

const tripSchema = z.object({
  name: z.string().min(2, "Povinné pole"),
  destination: z.string().min(2, "Povinné pole"),
  description: z.string().min(10, "Povinné pole"),
  priceCzk: z.coerce.number().min(1),
  days: z.coerce.number().min(1),
  imageUrl: z.string().url("Musí být platná URL").optional().or(z.literal("")),
  availableSpots: z.coerce.number().min(0).default(10),
  active: z.boolean().default(true),
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTripDialogOpen, setIsTripDialogOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);

  const { data: stats, isLoading: isLoadingStats } = useGetAdminStats();
  const { data: trips, isLoading: isLoadingTrips } = useAdminListTrips();
  const { data: bookings, isLoading: isLoadingBookings } = useAdminListBookings();

  const createTrip = useAdminCreateTrip();
  const updateTrip = useAdminUpdateTrip();
  const updateBookingStatus = useAdminUpdateBookingStatus();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: "",
      destination: "",
      description: "",
      priceCzk: 0,
      days: 0,
      imageUrl: "",
      availableSpots: 10,
      active: true,
    },
  });

  const handleOpenCreateDialog = () => {
    setEditingTripId(null);
    form.reset({
      name: "",
      destination: "",
      description: "",
      priceCzk: 0,
      days: 0,
      imageUrl: "",
      availableSpots: 10,
      active: true,
    });
    setIsTripDialogOpen(true);
  };

  const handleOpenEditDialog = (trip: any) => {
    setEditingTripId(trip.id);
    form.reset({
      name: trip.name,
      destination: trip.destination,
      description: trip.description,
      priceCzk: trip.priceCzk,
      days: trip.days,
      imageUrl: trip.imageUrl || "",
      availableSpots: trip.availableSpots,
      active: trip.active,
    });
    setIsTripDialogOpen(true);
  };

  const onTripSubmit = (data: TripFormValues) => {
    if (editingTripId) {
      updateTrip.mutate(
        { id: editingTripId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/trips"] });
            queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
            setIsTripDialogOpen(false);
            toast({ title: "Zájezd upraven" });
          },
        }
      );
    } else {
      createTrip.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/trips"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
            setIsTripDialogOpen(false);
            toast({ title: "Zájezd vytvořen" });
          },
        }
      );
    }
  };

  const handleToggleTripActive = (id: number, currentActive: boolean) => {
    updateTrip.mutate(
      { id, data: { active: !currentActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/trips"] });
          queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
          toast({ title: `Zájezd ${!currentActive ? 'aktivován' : 'deaktivován'}` });
        }
      }
    );
  };

  const handleChangeBookingStatus = (id: number, status: string) => {
    updateBookingStatus.mutate(
      { id, data: { status: status as BookingStatusUpdateStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
          toast({ title: "Status rezervace upraven" });
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrace</h1>
          <p className="text-muted-foreground mt-1">Správa zájezdů a rezervací</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové tržby</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalRevenueCzk.toLocaleString("cs-CZ")} Kč
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem rezervací</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalBookings}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.paidBookings} zaplacených
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čekající na platbu</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pendingBookings}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivní zájezdy</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeTrips}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Rezervace</TabsTrigger>
          <TabsTrigger value="trips">Zájezdy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Přehled rezervací</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Zatím nejsou žádné rezervace.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="h-12 px-4 font-medium text-muted-foreground">ID</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Klient</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Zájezd</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Typ</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-right">Částka</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Vytvořeno</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-b transition-colors hover:bg-muted/20">
                          <td className="p-4 font-medium">#{booking.id}</td>
                          <td className="p-4">
                            <div>{booking.customerName}</div>
                            <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                          </td>
                          <td className="p-4">{booking.trip?.name || `Zájezd #${booking.tripId}`}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {booking.bookingType === 'deposit' ? 'Záloha' : 'Plná platba'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {booking.paymentMethod === 'card' ? 'Karta' : 'QR převod'}
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium">
                            {booking.amountCzk.toLocaleString("cs-CZ")} Kč
                          </td>
                          <td className="p-4">
                            {format(new Date(booking.createdAt), "d. M. yyyy HH:mm", { locale: cs })}
                          </td>
                          <td className="p-4">
                            <Badge variant={STATUS_MAP[booking.status]?.variant || "default"}>
                              {STATUS_MAP[booking.status]?.label || booking.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Změnit status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleChangeBookingStatus(booking.id, "pending")}>
                                  Čeká
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeBookingStatus(booking.id, "deposit_paid")}>
                                  Záloha zaplacena
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeBookingStatus(booking.id, "fully_paid")}>
                                  Zaplaceno
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleChangeBookingStatus(booking.id, "cancelled")}
                                >
                                  Zrušit rezervaci
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Katalog zájezdů</CardTitle>
              <Dialog open={isTripDialogOpen} onOpenChange={setIsTripDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Přidat zájezd
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTripId ? 'Upravit zájezd' : 'Nový zájezd'}</DialogTitle>
                    <DialogDescription>
                      Vyplňte informace o zájezdu pro zobrazení na webu.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onTripSubmit)} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Název zájezdu</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="destination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lokalita / Cíl</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Počet dní</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="priceCzk"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cena (Kč)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="availableSpots"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kapacita</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>URL obrázku</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Popis</FormLabel>
                              <FormControl>
                                <Textarea className="min-h-[100px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Aktivní na webu</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Zájezd bude zobrazen klientům.
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsTripDialogOpen(false)}>
                          Zrušit
                        </Button>
                        <Button type="submit">
                          {editingTripId ? 'Uložit změny' : 'Vytvořit zájezd'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingTrips ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !trips || trips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Zatím nejsou žádné zájezdy. Vytvořte první.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Obrázek</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Název</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground">Lokalita</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-right">Dní</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-right">Cena</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-right">Kapacita</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground text-center">Status</th>
                        <th className="h-12 px-4 font-medium text-muted-foreground w-20">Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => (
                        <tr key={trip.id} className={`border-b transition-colors hover:bg-muted/20 ${!trip.active ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                          <td className="p-4 w-20">
                            {trip.imageUrl ? (
                              <img src={trip.imageUrl} alt="" className="w-12 h-12 object-cover rounded-md" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <Map className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-medium max-w-[200px] truncate">{trip.name}</td>
                          <td className="p-4">{trip.destination}</td>
                          <td className="p-4 text-right">{trip.days}</td>
                          <td className="p-4 text-right">{trip.priceCzk.toLocaleString("cs-CZ")} Kč</td>
                          <td className="p-4 text-right">{trip.availableSpots}</td>
                          <td className="p-4 text-center">
                            <Badge variant={trip.active ? "default" : "secondary"}>
                              {trip.active ? 'Aktivní' : 'Skryto'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleOpenEditDialog(trip)}
                                title="Upravit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${trip.active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                                onClick={() => handleToggleTripActive(trip.id, trip.active)}
                                title={trip.active ? "Skrýt" : "Zobrazit"}
                              >
                                {trip.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
