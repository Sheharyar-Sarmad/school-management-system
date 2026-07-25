import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  Bell,
  ClipboardList,
  FileText,
  Clock,
  LogOut,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/admin/classes", label: "Classes", icon: Building },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/fees", label: "Fees", icon: CreditCard },
    { href: "/admin/exams", label: "Exams", icon: ClipboardList },
    { href: "/admin/timetable", label: "Timetable", icon: Calendar },
    { href: "/admin/attendance", label: "Attendance", icon: Clock },
    { href: "/admin/announcements", label: "Announcements", icon: Bell },
    { href: "/admin/leaves", label: "Leaves", icon: FileText },
  ];

  const teacherLinks = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/assignments", label: "Assignments", icon: FileText },
    { href: "/teacher/attendance", label: "Attendance", icon: Clock },
    { href: "/teacher/exams", label: "Exams", icon: ClipboardList },
    { href: "/teacher/results", label: "Results", icon: GraduationCap },
    { href: "/teacher/announcements", label: "Announcements", icon: Bell },
    { href: "/teacher/timetable", label: "Timetable", icon: Calendar },
  ];

  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/attendance", label: "Attendance", icon: Clock },
    { href: "/student/assignments", label: "Assignments", icon: FileText },
    { href: "/student/exams", label: "Exams", icon: ClipboardList },
    { href: "/student/results", label: "Results", icon: GraduationCap },
    { href: "/student/fees", label: "Fees", icon: CreditCard },
    { href: "/student/timetable", label: "Timetable", icon: Calendar },
    { href: "/student/leaves", label: "Leaves", icon: FileText },
  ];

  const links = 
    user.role === "admin" ? adminLinks :
    user.role === "teacher" ? teacherLinks :
    studentLinks;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              E
            </div>
            EduCore
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = location === link.href || (location.startsWith(link.href + "/") && link.href !== `/${user.role}`);
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
              E
            </div>
            EduCore
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/30">
          {children}
        </div>
      </main>
    </div>
  );
}
