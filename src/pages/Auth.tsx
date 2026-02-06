import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Mail, Lock, User, Calendar, MapPin, GraduationCap, Loader2 } from "lucide-react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { toast } from "sonner";
import EducationSelector, { EducationEntry } from "@/components/education/EducationSelector";

const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    province: "",
    domicile: "",
  });
  
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      const emailResult = emailSchema.safeParse(formData.email);
      if (!emailResult.success) {
        toast.error(emailResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Validate password
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        toast.error(passwordResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          navigate("/dashboard");
        }
      } else {
        // Validate name
        const nameResult = nameSchema.safeParse(formData.name);
        if (!nameResult.success) {
          toast.error(nameResult.error.errors[0].message);
          setLoading(false);
          return;
        }

        // Check password confirmation
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.name,
          date_of_birth: formData.dob || undefined,
          gender: formData.gender || undefined,
          province: formData.province || undefined,
          domicile: formData.domicile || undefined,
          educations: educationEntries,
        });
        
        if (!error) {
          navigate("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12">
      <div className="container max-w-lg">
        <div className="card-elevated p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Pak<span className="text-primary">Jobs</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Register to find eligible government jobs"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="dob" 
                        type="date" 
                        className="pl-10"
                        value={formData.dob}
                        onChange={(e) => handleChange("dob", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Education</Label>
                  <EducationSelector
                    value={educationEntries}
                    onChange={setEducationEntries}
                    maxEntries={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Select value={formData.province} onValueChange={(v) => handleChange("province", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Sindh">Sindh</SelectItem>
                        <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                        <SelectItem value="Balochistan">Balochistan</SelectItem>
                        <SelectItem value="Islamabad">Islamabad</SelectItem>
                        <SelectItem value="AJK">AJK</SelectItem>
                        <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domicile">Domicile</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="domicile"
                        placeholder="e.g., Lahore"
                        className="pl-10"
                        value={formData.domicile}
                        onChange={(e) => handleChange("domicile", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
