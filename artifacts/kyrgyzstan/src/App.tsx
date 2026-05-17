import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { useCookieConsent } from "@/hooks/useCookieConsent";

import Home from "@/pages/Home";
import TripDetail from "@/pages/TripDetail";
import QrPayment from "@/pages/QrPayment";
import Success from "@/pages/Success";
import AdminGuard from "@/pages/AdminGuard";
import Gallery from "@/pages/Gallery";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/trip/:id" component={TripDetail} />
          <Route path="/payment/qr/:bookingId" component={QrPayment} />
          <Route path="/payment/success" component={Success} />
          <Route path="/admin" component={AdminGuard} />
          <Route path="/galerie" component={Gallery} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function Analytics() {
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (consent !== "accepted") return;

    // ─── Add analytics scripts here when ready ───────────────────────────
    // Example — Google Analytics:
    //   const GA_ID = "G-XXXXXXXXXX";
    //   const script = document.createElement("script");
    //   script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    //   script.async = true;
    //   document.head.appendChild(script);
    //   window.gtag?.("config", GA_ID);
    // ────────────────────────────────────────────────────────────────────
  }, [consent]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <CookieBanner />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
