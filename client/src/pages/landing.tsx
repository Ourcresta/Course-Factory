import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  BookOpen,
  Award,
  FlaskConical,
  CheckCircle,
  ArrowRight,
  Brain,
  Zap,
  Shield,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight" data-testid="text-landing-brand">
                  Oushiksha
                </span>
                <span className="text-xs text-muted-foreground -mt-1">Guru</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login?mode=signin">
                <Button variant="ghost" data-testid="button-signin">
                  Sign In
                </Button>
              </Link>
              <Link href="/login?mode=signup">
                <Button data-testid="button-signup">
                  Sign Up
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-sm text-muted-foreground mb-6">
              <Brain className="h-4 w-4" />
              AI-Powered Course Factory
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Create Complete Courses
              <span className="block text-primary">From Simple Commands</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Transform single instructions into production-ready courses with full syllabi, 
              modules, lessons, practice labs, projects, and tests. Powered by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?mode=signup">
                <Button size="lg" className="min-w-48" data-testid="button-get-started">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login?mode=signin">
                <Button size="lg" variant="outline" className="min-w-48" data-testid="button-signin-hero">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Everything You Need to Build Courses
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Generate complete educational content in minutes, not weeks
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Brain}
                title="AI Course Generation"
                description="Describe what you want to teach and let AI create the complete course structure with modules and lessons."
              />
              <FeatureCard
                icon={FlaskConical}
                title="Practice Labs"
                description="Automatically generate hands-on coding exercises with starter code, hints, and validation logic."
              />
              <FeatureCard
                icon={BookOpen}
                title="Tests & Assessments"
                description="Create MCQ and scenario-based tests with difficulty levels and passing criteria."
              />
              <FeatureCard
                icon={Award}
                title="Certificates"
                description="Configure completion certificates with skill tags and custom requirements."
              />
              <FeatureCard
                icon={Zap}
                title="Preview & Publish Modes"
                description="Quick preview mode for review, full publish mode for production-ready content."
              />
              <FeatureCard
                icon={Shield}
                title="Secure Admin Portal"
                description="Role-based access with OTP verification and API key management for integrations."
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground mb-12">
              From idea to published course in three simple steps
            </p>
            
            <div className="grid gap-8 md:grid-cols-3">
              <StepCard
                number="1"
                title="Describe Your Course"
                description="Enter a simple command like 'Create a Python fundamentals course for beginners'"
              />
              <StepCard
                number="2"
                title="AI Generates Content"
                description="Our AI creates modules, lessons, labs, tests, and projects automatically"
              />
              <StepCard
                number="3"
                title="Review & Publish"
                description="Edit, refine, and publish your course to make it available to students"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Create Your First Course?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join Oushiksha Guru and start building educational content with AI today.
            </p>
            <Link href="/login?mode=signup">
              <Button size="lg" data-testid="button-cta-signup">
                <Sparkles className="h-5 w-5 mr-2" />
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Oushiksha Guru</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin Course Factory v1.0 - Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-background hover-elevate">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
