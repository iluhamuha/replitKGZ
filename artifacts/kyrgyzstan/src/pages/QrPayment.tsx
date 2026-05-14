import { useParams, Link } from "wouter";
import { useGetQrPayment, getGetQrPaymentQueryKey, useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { QrCode, ArrowLeft, Copy, Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function QrPayment() {
  const params = useParams();
  const bookingId = parseInt(params.bookingId || "0", 10);
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: qrData, isLoading: isLoadingQr } = useGetQrPayment(bookingId, {
    query: {
      enabled: !!bookingId,
      queryKey: getGetQrPaymentQueryKey(bookingId),
    }
  });

  const { data: booking, isLoading: isLoadingBooking } = useGetBooking(bookingId, {
    query: {
      enabled: !!bookingId,
      queryKey: getGetBookingQueryKey(bookingId),
    }
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Zkopírováno",
      description: "Údaj byl zkopírován do schránky.",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoadingQr || isLoadingBooking) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Skeleton className="h-64 w-64 rounded-xl mb-8" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!qrData || !booking) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Platební údaje nenalezeny</h1>
        <p className="text-muted-foreground mb-8">
          Omlouváme se, ale pro tuto rezervaci se nepodařilo vygenerovat platební údaje.
        </p>
        <Button asChild>
          <Link href="/">Zpět na hlavní stránku</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6 -ml-4">
          <Link href={`/trip/${booking.tripId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na detail zájezdu
          </Link>
        </Button>

        <Card className="border-border/60 shadow-lg overflow-hidden">
          <div className="bg-primary/10 p-6 border-b border-border text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">QR Platba převodem</h1>
            <p className="text-muted-foreground">
              Dokončete svou rezervaci uhrazením částky pomocí bankovní aplikace.
            </p>
          </div>
          
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
              
              {/* QR Code Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border shrink-0 flex flex-col items-center">
                <img 
                  src={`data:image/png;base64,${qrData.qrBase64}`} 
                  alt="QR kód pro platbu"
                  className="w-56 h-56 object-contain"
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Oskenujte ve své<br/>bankovní aplikaci
                </p>
              </div>

              {/* Payment Details Section */}
              <div className="w-full flex-1 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground border-b pb-2">Platební údaje</h3>
                  
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Částka</p>
                        <p className="font-bold text-lg text-foreground">{qrData.amountCzk.toLocaleString("cs-CZ")} Kč</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(qrData.amountCzk.toString(), "amount")}>
                        {copiedField === "amount" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Číslo účtu (IBAN)</p>
                        <p className="font-mono font-medium text-foreground">{qrData.iban}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(qrData.iban, "iban")}>
                        {copiedField === "iban" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Variabilní symbol</p>
                        <p className="font-mono font-medium text-foreground">{qrData.variableSymbol}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(qrData.variableSymbol, "vs")}>
                        {copiedField === "vs" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/30 border-t p-6 flex flex-col items-center text-center">
            <div className="flex items-center justify-center text-primary mb-3">
              <ShieldCheck className="h-5 w-5 mr-2" />
              <span className="font-medium">Potvrzení do 24 hodin</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Jakmile platbu přijmeme, zašleme vám e-mail s potvrzením rezervace zájezdu <strong>{qrData.tripName}</strong> na adresu <strong>{qrData.customerEmail}</strong>.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline" className="font-medium">
                <Link href="/">Vrátit se na hlavní stránku</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
