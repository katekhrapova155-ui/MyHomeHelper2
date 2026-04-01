import { useNavigate } from "react-router-dom";
import { CalendarCheck, Lightbulb, ListTodo, ShoppingCart, Calendar, ClipboardList, BarChart3, UserCircle, Users, ChevronRight } from "lucide-react";
import { NotificationBanner } from "@/components/NotificationBanner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { migrateLocalStorageToDb } from "@/lib/supabase-storage";

const navItems = [
  { to: "/daily", icon: CalendarCheck, label: "Повседневные дела", color: "bg-primary" },
  { to: "/plans", icon: Lightbulb, label: "Планы вперёд", color: "bg-accent" },
  { to: "/active", icon: ListTodo, label: "Активные дела", color: "bg-secondary" },
  { to: "/shopping", icon: ShoppingCart, label: "Список покупок", color: "bg-warning" },
  { to: "/calendar", icon: Calendar, label: "Календарь", color: "bg-accent" },
  { to: "/checklists", icon: ClipboardList, label: "Чеклисты", color: "bg-primary" },
  { to: "/stats", icon: BarChart3, label: "Статистика", color: "bg-secondary" },
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Migrate localStorage data on first load
  useEffect(() => {
    if (user) migrateLocalStorageToDb(user.id);
  }, [user]);

  const { data: myGroups } = useQuery({
    queryKey: ["myGroups", user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase.from("group_members").select("group_id, role").eq("user_id", user!.id);
      if (!memberships?.length) return [];
      const groupIds = memberships.map((m) => m.group_id);
      const { data: groups } = await supabase.from("groups").select("*").in("id", groupIds);
      return (groups || []).map((g) => ({
        ...g,
        role: memberships.find((m) => m.group_id === g.id)?.role || "member",
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-6 pb-12 bg-background relative">
      <button
        onClick={() => navigate("/account")}
        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted transition-colors active:scale-95"
      >
        <UserCircle className="w-7 h-7 text-foreground" />
      </button>

      <NotificationBanner />

      <div className="animate-fade-up mb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          Дела дома
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">Всё под контролем</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {navItems.map((item, i) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="animate-fade-up flex flex-col items-center gap-3 p-6 rounded-2xl bg-card shadow-md hover:shadow-lg transition-shadow active:scale-[0.97] border border-border"
            style={{ animationDelay: `${100 + i * 80}ms` }}
          >
            <div className={`${item.color} p-3 rounded-xl`}>
              <item.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground text-center leading-snug">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Group quick access */}
      {myGroups && myGroups.length > 0 && (
        <div className="w-full max-w-sm mt-8 space-y-3 animate-fade-up" style={{ animationDelay: "700ms" }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" /> Большие аккаунты
          </h2>
          {myGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-all active:scale-[0.97]"
            >
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold text-foreground">{g.name}</span>
                <span className="block text-xs text-muted-foreground">{g.role === "owner" ? "Владелец" : "Участник"}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
