import { Mountain } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card text-muted-foreground py-8">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <Mountain className="h-5 w-5" />
          <span>Kyrgyzstán Zájezdy</span>
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Kyrgyzstán Zájezdy. Všechna práva vyhrazena.
        </p>
      </div>
    </footer>
  );
}
