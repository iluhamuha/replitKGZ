import { Link } from "wouter";
import { CheckCircle, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Success() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full scale-150 animate-pulse" />
            <CheckCircle className="relative z-10 h-24 w-24 text-green-600 dark:text-green-500 bg-background rounded-full" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Rezervace potvrzena!
          </h1>
          <p className="text-lg text-muted-foreground">
            Vaše dobrodružství v Kyrgyzstánu začíná. E-mail s potvrzením platby a 
            podrobnějšími informacemi o zájezdu jsme vám právě odeslali.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 border border-border/50">
          <Mountain className="h-8 w-8 text-primary mx-auto mb-3 opacity-80" />
          <p className="text-sm font-medium">
            Těšíme se na vás na letišti. Pokud máte jakékoliv dotazy, 
            neváhejte nás kontaktovat.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto px-8 font-semibold">
            <Link href="/">Zpět na přehled zájezdů</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
