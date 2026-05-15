import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAuthStatus, useSetupAdminPassword, useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const queryClient = useQueryClient();
  const { data: authStatus, isLoading } = useGetAuthStatus();
  const setup = useSetupAdminPassword();
  const login = useAdminLogin();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">Načítání...</div>
      </div>
    );
  }

  const isSetup = !authStatus?.hasPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSetup) {
      if (password.length < 6) {
        setError("Heslo musí mít alespoň 6 znaků.");
        return;
      }
      if (password !== confirm) {
        setError("Hesla se neshodují.");
        return;
      }
      setup.mutate(
        { data: { password } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
          },
          onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Chyba při nastavování hesla.");
          },
        },
      );
    } else {
      login.mutate(
        { data: { password } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
          },
          onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Nesprávné heslo.");
          },
        },
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isSetup ? (
              <KeyRound className="h-6 w-6 text-primary" />
            ) : (
              <Lock className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isSetup ? "Nastavení hesla" : "Přihlášení do administrace"}
          </CardTitle>
          <CardDescription>
            {isSetup
              ? "Vytvořte heslo pro přístup do administrace. Tato akce je jednorázová."
              : "Zadejte heslo pro přístup do administrace."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">{isSetup ? "Nové heslo" : "Heslo"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>
            {isSetup && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Potvrzení hesla</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={setup.isPending || login.isPending}
            >
              {isSetup ? "Vytvořit heslo a přihlásit se" : "Přihlásit se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
