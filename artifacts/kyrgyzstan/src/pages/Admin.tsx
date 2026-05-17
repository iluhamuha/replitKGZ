import { useState, useRef, type ReactNode } from "react";
import { 
  useGetAdminStats, 
  useAdminListTrips, 
  useAdminListBookings,
  useAdminUpdateTrip,
  useAdminCreateTrip,
  useAdminUpdateBookingStatus,
  useAdminCreateGalleryPhoto,
  useAdminUpdateGalleryPhoto,
  useAdminDeleteGalleryPhoto,
  useGetTripGallery,
  useAdminLogout,
  useAdminListTripDates,
  useAdminCreateTripDate,
  useAdminUpdateTripDate,
  useAdminDeleteTripDate,
  BookingStatusUpdateStatus,
  type Trip,
  type GalleryPhoto,
  type TripDate,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
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
  X,
  Trash2,
  Image,
  LogOut,
  Images,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  priceIncludes: z.string().optional().default(""),
  priceExcludes: z.string().optional().default(""),
});

type TripFormValues = z.infer<typeof tripSchema>;

const galleryPhotoSchema = z.object({
  imageUrl: z
    .string()
    .min(1, "Přidejte URL nebo nahrajte obrázek")
    .refine(
      (v) => /^https?:\/\//.test(v) || v.startsWith("/api/storage/objects/"),
      "Musí být platná URL (https://...) nebo nahraný soubor"
    ),
  caption: z.string().min(2, "Povinné pole"),
  location: z.string().optional().default(""),
  sortOrder: z.coerce.number().default(0),
});

type GalleryPhotoFormValues = z.infer<typeof galleryPhotoSchema>;

function CollapsibleSection({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">{icon}{label}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function TripGalleryManager({ tripId, tripName }: { tripId: number; tripName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading } = useGetTripGallery(tripId);

  const createPhoto = useAdminCreateGalleryPhoto();
  const updatePhoto = useAdminUpdateGalleryPhoto();
  const deletePhoto = useAdminDeleteGalleryPhoto();

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response: { objectPath: string }) => {
      galleryForm.setValue("imageUrl", `/api/storage${response.objectPath}`, { shouldValidate: true });
      toast({ title: "Obrázek nahrán" });
    },
    onError: () => {
      toast({ title: "Chyba při nahrávání", variant: "destructive" });
    },
  });

  const galleryForm = useForm<GalleryPhotoFormValues>({
    resolver: zodResolver(galleryPhotoSchema),
    defaultValues: { imageUrl: "", caption: "", location: "", sortOrder: 0 },
  });

  const handleOpenCreatePhotoDialog = () => {
    setEditingPhotoId(null);
    galleryForm.reset({ imageUrl: "", caption: "", location: "", sortOrder: (photos?.length ?? 0) + 1 });
    setIsPhotoDialogOpen(true);
  };

  const handleOpenEditPhotoDialog = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    galleryForm.reset({ imageUrl: photo.imageUrl, caption: photo.caption, location: photo.location ?? "", sortOrder: photo.sortOrder });
    setIsPhotoDialogOpen(true);
  };

  const invalidateGallery = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}/gallery`] });
    queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
  };

  const onPhotoSubmit = (data: GalleryPhotoFormValues) => {
    if (editingPhotoId) {
      updatePhoto.mutate(
        { id: editingPhotoId, data: { tripId, ...data } },
        {
          onSuccess: () => {
            invalidateGallery();
            setIsPhotoDialogOpen(false);
            toast({ title: "Fotografie upravena" });
          },
        }
      );
    } else {
      createPhoto.mutate(
        { data: { tripId, ...data } },
        {
          onSuccess: () => {
            invalidateGallery();
            setIsPhotoDialogOpen(false);
            toast({ title: "Fotografie přidána" });
          },
        }
      );
    }
  };

  const handleDeletePhoto = (id: number) => {
    if (!confirm("Opravdu smazat tuto fotografii?")) return;
    deletePhoto.mutate({ id }, {
      onSuccess: () => {
        invalidateGallery();
        toast({ title: "Fotografie smazána" });
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          <Images className="h-4 w-4" />
          Fotografie zájezdu
          {photos && photos.length > 0 && (
            <Badge variant="secondary" className="text-xs">{photos.length}</Badge>
          )}
        </h4>
        <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={handleOpenCreatePhotoDialog}>
              <Plus className="h-3 w-3 mr-1" />
              Přidat foto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPhotoId ? "Upravit fotografii" : "Nová fotografie"}</DialogTitle>
              <DialogDescription>
                Fotografie pro zájezd: <strong>{tripName}</strong>
              </DialogDescription>
            </DialogHeader>
            <Form {...galleryForm}>
              <form onSubmit={galleryForm.handleSubmit(onPhotoSubmit)} className="space-y-4 py-2">
                <FormField
                  control={galleryForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obrázek</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="https://... nebo nahrajte soubor níže" {...field} />
                          </FormControl>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) await uploadFile(file);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                          >
                            <Image className="h-4 w-4" />
                            {isUploading ? "Nahrávám..." : "Nahrát ze zařízení"}
                          </Button>
                          <span className="text-xs text-muted-foreground">nebo vložte URL výše</span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {galleryForm.watch("imageUrl") && (
                  <div className="rounded-md overflow-hidden border h-40">
                    <img
                      src={galleryForm.watch("imageUrl")}
                      alt="Náhled"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <FormField
                  control={galleryForm.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Popis fotografie</FormLabel>
                      <FormControl>
                        <Input placeholder="Jezero Issyk-Kul za svítání" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={galleryForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokalita</FormLabel>
                        <FormControl>
                          <Input placeholder="Oblast Issyk-Kul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={galleryForm.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pořadí</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>
                    Zrušit
                  </Button>
                  <Button type="submit">
                    {editingPhotoId ? "Uložit změny" : "Přidat fotografii"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
      ) : !photos || photos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
          <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Žádné fotografie. Přidejte první.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-md overflow-hidden border bg-muted aspect-[4/3]">
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => handleOpenEditPhotoDialog(photo)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-white text-xs line-clamp-2 leading-tight">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tripDateSchema = z.object({
  departureDate: z.string().min(1, "Povinné pole"),
  returnDate: z.string().optional().default(""),
  availableSpots: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional().default(""),
});

type TripDateFormValues = z.infer<typeof tripDateSchema>;

function TripDatesManager({ tripId, tripName }: { tripId: number; tripName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSpots, setEditingSpots] = useState<{ id: number; value: string } | null>(null);

  const { data: dates, isLoading } = useAdminListTripDates(tripId);
  const createDate = useAdminCreateTripDate();
  const updateDate = useAdminUpdateTripDate();
  const deleteDate = useAdminDeleteTripDate();

  const dateForm = useForm<TripDateFormValues>({
    resolver: zodResolver(tripDateSchema),
    defaultValues: { departureDate: "", returnDate: "", notes: "" },
  });

  const invalidateDates = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/trips/${tripId}/dates`] });
    queryClient.invalidateQueries({ queryKey: [`/api/trips/${tripId}/dates`] });
  };

  const onSubmit = (data: TripDateFormValues) => {
    createDate.mutate(
      {
        id: tripId,
        data: {
          departureDate: data.departureDate,
          returnDate: data.returnDate || undefined,
          availableSpots: data.availableSpots ?? undefined,
          notes: data.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          invalidateDates();
          setIsOpen(false);
          dateForm.reset({ departureDate: "", returnDate: "", notes: "" });
          toast({ title: "Termín přidán" });
        },
        onError: () => toast({ title: "Chyba při přidávání termínu", variant: "destructive" }),
      }
    );
  };

  const handleSaveSpots = (id: number) => {
    if (!editingSpots) return;
    const spots = editingSpots.value === "" ? null : parseInt(editingSpots.value, 10);
    updateDate.mutate(
      { id, data: { availableSpots: spots } },
      {
        onSuccess: () => {
          invalidateDates();
          setEditingSpots(null);
          toast({ title: "Kapacita uložena" });
        },
        onError: () => toast({ title: "Chyba při ukládání", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Opravdu smazat tento termín?")) return;
    deleteDate.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateDates();
          toast({ title: "Termín smazán" });
        },
      }
    );
  };

  const formatCzechDate = (iso: string) => {
    try {
      return format(new Date(iso + "T00:00:00"), "d. M. yyyy", { locale: cs });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Termíny odjezdu
          {dates && dates.length > 0 && (
            <Badge variant="secondary" className="text-xs">{dates.length}</Badge>
          )}
        </h4>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Přidat termín
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nový termín</DialogTitle>
              <DialogDescription>Termín pro zájezd: <strong>{tripName}</strong></DialogDescription>
            </DialogHeader>
            <Form {...dateForm}>
              <form onSubmit={dateForm.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dateForm.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum odjezdu</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dateForm.control}
                    name="returnDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum návratu <span className="text-muted-foreground text-xs">(volitelné)</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={dateForm.control}
                  name="availableSpots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volná místa <span className="text-muted-foreground text-xs">(volitelné — přepíše výchozí kapacitu)</span></FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="Výchozí dle zájezdu" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dateForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poznámka <span className="text-muted-foreground text-xs">(volitelné)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Např. Možno prodloužení o 3 dny" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Zrušit</Button>
                  <Button type="submit" disabled={createDate.isPending}>Přidat termín</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-10 rounded-md" />)}
        </div>
      ) : !dates || dates.length === 0 ? (
        <div className="text-center py-5 text-muted-foreground border-2 border-dashed rounded-lg">
          <CalendarDays className="h-7 w-7 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Žádné termíny. Přidejte první.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map((d: TripDate) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/30 gap-2">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-medium">
                  {formatCzechDate(d.departureDate)}
                  {d.returnDate ? ` – ${formatCzechDate(d.returnDate)}` : ""}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {editingSpots?.id === d.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        className="h-6 w-20 text-xs px-1"
                        placeholder="míst"
                        value={editingSpots.value}
                        onChange={(e) => setEditingSpots({ id: d.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSpots(d.id);
                          if (e.key === "Escape") setEditingSpots(null);
                        }}
                        autoFocus
                      />
                      <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSaveSpots(d.id)} disabled={updateDate.isPending}>Uložit</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={() => setEditingSpots(null)}>✕</Button>
                    </div>
                  ) : (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 group"
                      onClick={() => setEditingSpots({ id: d.id, value: d.availableSpots != null ? String(d.availableSpots) : "" })}
                      title="Kliknout pro úpravu kapacity"
                    >
                      <Users className="h-3 w-3" />
                      {d.bookedCount ?? 0} lidí · {d.availableSpots != null ? Math.max(0, d.availableSpots - (d.bookedCount ?? 0)) : "∞"} volných míst
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </button>
                  )}
                  {d.notes && <span className="text-xs text-muted-foreground italic">{d.notes}</span>}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(d.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TripEditDialog({ 
  trip, 
  open, 
  onOpenChange,
  editingTripId,
  form,
  onTripSubmit
}: {
  trip?: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTripId: number | null;
  form: UseFormReturn<TripFormValues>;
  onTripSubmit: (data: TripFormValues) => void;
}) {
  return (
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

            <FormField
              control={form.control}
              name="priceIncludes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Cena zahrnuje</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder={"Jeden řádek = jedna položka. Např.:\nLetenky Praha–Biškek\nUbytování v jurtech\nPrůvodce po celou dobu"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceExcludes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Cena nezahrnuje</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder={"Jeden řádek = jedna položka. Např.:\nCestovní pojištění\nOsobní výdaje"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {editingTripId && trip && (
            <>
              <CollapsibleSection icon={<CalendarDays className="h-4 w-4" />} label="Termíny odjezdu">
                <TripDatesManager tripId={editingTripId} tripName={trip.name} />
              </CollapsibleSection>
              <CollapsibleSection icon={<Images className="h-4 w-4" />} label="Fotografie zájezdu">
                <TripGalleryManager tripId={editingTripId} tripName={trip.name} />
              </CollapsibleSection>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button type="submit">
              {editingTripId ? 'Uložit změny' : 'Vytvořit zájezd'}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTripDialogOpen, setIsTripDialogOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const { data: stats, isLoading: isLoadingStats } = useGetAdminStats();
  const { data: trips, isLoading: isLoadingTrips } = useAdminListTrips();
  const { data: bookings, isLoading: isLoadingBookings } = useAdminListBookings();

  const createTrip = useAdminCreateTrip();
  const updateTrip = useAdminUpdateTrip();
  const updateBookingStatus = useAdminUpdateBookingStatus();
  const logout = useAdminLogout();

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
      priceIncludes: "",
      priceExcludes: "",
    },
  });

  const handleOpenCreateDialog = () => {
    setEditingTripId(null);
    setEditingTrip(null);
    form.reset({
      name: "",
      destination: "",
      description: "",
      priceCzk: 0,
      days: 0,
      imageUrl: "",
      availableSpots: 10,
      active: true,
      priceIncludes: "",
      priceExcludes: "",
    });
    setIsTripDialogOpen(true);
  };

  const handleOpenEditDialog = (trip: any) => {
    setEditingTripId(trip.id);
    setEditingTrip(trip);
    form.reset({
      name: trip.name,
      destination: trip.destination,
      description: trip.description,
      priceCzk: trip.priceCzk,
      days: trip.days,
      imageUrl: trip.imageUrl || "",
      availableSpots: trip.availableSpots,
      active: trip.active,
      priceIncludes: trip.priceIncludes || "",
      priceExcludes: trip.priceExcludes || "",
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout.mutate(undefined, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] }) })}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Odhlásit se
        </Button>
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
                        <th className="h-12 px-4 font-medium text-muted-foreground">Termín</th>
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
                          <td className="p-4 text-sm">
                            {booking.tripDate ? (
                              <span>
                                {format(new Date(booking.tripDate.departureDate + "T00:00:00"), "d. M. yyyy", { locale: cs })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
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
                <TripEditDialog
                  trip={editingTrip}
                  open={isTripDialogOpen}
                  onOpenChange={setIsTripDialogOpen}
                  editingTripId={editingTripId}
                  form={form}
                  onTripSubmit={onTripSubmit}
                />
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
