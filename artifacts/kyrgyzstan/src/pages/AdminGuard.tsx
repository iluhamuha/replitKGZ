import { useGetAuthStatus } from "@workspace/api-client-react";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";

export default function AdminGuard() {
  const { data: authStatus, isLoading } = useGetAuthStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">Načítání...</div>
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return <AdminLogin />;
  }

  return <Admin />;
}
