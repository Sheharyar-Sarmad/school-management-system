import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password is too short"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@school.com",
      password: "password123",
    },
  });

  const setDemoCredentials = (selectedRole: "admin" | "teacher" | "student") => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      form.setValue("email", "admin@school.com");
    } else if (selectedRole === "teacher") {
      form.setValue("email", "teacher1@school.com");
    } else {
      form.setValue("email", "student1@school.com");
    }
    form.setValue("password", "password123");
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      login(response.token, response.user);
      
      // Redirect based on role
      if (response.user.role === "admin") setLocation("/admin");
      else if (response.user.role === "teacher") setLocation("/teacher");
      else setLocation("/student");
      
      toast.success("Welcome back to EduCore!");
    } catch (e: any) {
      toast.error(e.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/30">
            E
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">EduCore</h1>
        </motion.div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">School Management Platform</p>
      </div>

      <Card className="w-full max-w-md border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">Select your role to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button
              type="button"
              variant={role === "admin" ? "default" : "outline"}
              className={`h-auto py-3 px-2 flex flex-col gap-2 ${role !== "admin" ? "bg-transparent" : ""}`}
              onClick={() => setDemoCredentials("admin")}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs">Admin</span>
            </Button>
            <Button
              type="button"
              variant={role === "teacher" ? "default" : "outline"}
              className={`h-auto py-3 px-2 flex flex-col gap-2 ${role !== "teacher" ? "bg-transparent" : ""}`}
              onClick={() => setDemoCredentials("teacher")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Teacher</span>
            </Button>
            <Button
              type="button"
              variant={role === "student" ? "default" : "outline"}
              className={`h-auto py-3 px-2 flex flex-col gap-2 ${role !== "student" ? "bg-transparent" : ""}`}
              onClick={() => setDemoCredentials("student")}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs">Student</span>
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email address</Label>
                    <FormControl>
                      <Input placeholder="name@school.com" {...field} className="bg-white dark:bg-slate-950" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>Password</Label>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-white dark:bg-slate-950" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
            Demo credentials are pre-filled based on selected role.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
