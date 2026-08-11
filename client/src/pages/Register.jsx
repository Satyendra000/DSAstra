import { SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const Register = () => {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 pl-24 relative overflow-hidden bg-bg-deep">
        {/* Ambient Gradient Orbs */}
        <div className="ambient-orb w-[500px] h-[500px] bg-accent/8 top-[-10%] left-[-5%] animate-float" />
        <div className="ambient-orb w-[300px] h-[300px] bg-accent-secondary/6 bottom-[10%] right-[-5%]" style={{ animationDelay: '4s' }} />
        <div className="ambient-orb w-[200px] h-[200px] bg-accent/4 top-[50%] left-[30%]" style={{ animationDelay: '7s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-lg animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg glow-accent">
              <span className="material-symbols-outlined text-white text-[18px] font-bold">code</span>
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">DSAstra</span>
          </div>

          {/* Heading */}
          <h1 className="text-[48px] font-bold text-text-primary leading-[1.1] mb-6 tracking-[-0.03em]">
            <span className="text-gradient-white">Master Data</span><br />
            <span className="text-gradient-white">Structures &</span><br />
            <span className="text-accent">Algorithms.</span>
          </h1>

          <p className="text-lg text-text-secondary mb-14 max-w-md leading-relaxed">
            Join the next generation of developers using AI-driven insights to crack coding interviews and build better software.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {[
              {
                icon: "auto_stories",
                title: "Personalized Roadmaps",
                desc: "Curriculums adapted to your skill level.",
                color: "text-blue",
                bg: "bg-blue/10 border-blue/15",
              },
              {
                icon: "bolt",
                title: "Real-time Battles",
                desc: "Challenge peers in live coding duels.",
                color: "text-accent-secondary",
                bg: "bg-accent-secondary/10 border-accent-secondary/15",
              },
              {
                icon: "smart_toy",
                title: "AI Code Assistant",
                desc: "Instant feedback on complexity and bugs.",
                color: "text-emerald",
                bg: "bg-emerald/10 border-emerald/15",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`flex items-start gap-4 animate-fade-in-up stagger-${i + 2}`}
              >
                <div className={`p-2.5 rounded-xl border ${feature.bg} shrink-0`}>
                  <span className={`material-symbols-outlined text-[22px] ${feature.color}`}>{feature.icon}</span>
                </div>
                <div>
                  <h3 className="text-text-primary font-semibold text-[15px]">{feature.title}</h3>
                  <p className="text-[13px] text-text-secondary mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-4 mt-12 max-w-lg animate-fade-in-up stagger-5">
          <div className="flex -space-x-3">
            {[
              "bg-gradient-to-br from-blue-500/60 to-blue-500/30",
              "bg-gradient-to-br from-accent-secondary/60 to-accent-secondary/30",
              "bg-gradient-to-br from-emerald/60 to-emerald/30",
            ].map((bg, i) => (
              <div key={i} className={`w-10 h-10 rounded-full border-2 border-bg-deep ${bg}`} />
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-bg-deep bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
              +2k
            </div>
          </div>
          <p className="text-[13px] text-text-secondary">Joined by <span className="text-text-primary font-medium">2,000+</span> developers this week</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-bg-base relative">
        {/* Subtle orb */}
        <div className="ambient-orb w-[350px] h-[350px] bg-accent-secondary/5 top-[-10%] right-[-5%]" />

        <div className="w-full max-w-md z-10 relative animate-scale-in">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#3b82f6',
                colorBackground: 'transparent',
                colorInputBackground: '#18181b',
                colorInputText: '#f4f4f5',
                colorText: '#f4f4f5',
                colorTextSecondary: '#a1a1aa',
                fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
                borderRadius: '0.75rem',
              },
              elements: {
                card: "bg-transparent shadow-none p-0 w-full",
                headerTitle: "text-3xl font-bold text-text-primary mb-2 tracking-tight",
                headerSubtitle: "text-text-secondary mb-8",
                socialButtonsBlockButton: "border border-white/[0.08] hover:bg-white/[0.05] bg-white/[0.02] text-text-primary transition-all duration-200 rounded-xl active:scale-[0.98]",
                socialButtonsBlockButtonText: "font-normal hidden md:block",
                formButtonPrimary: "font-semibold py-3 transition-all duration-200 text-white rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98]",
                formFieldInput: "w-full border border-white/[0.08] focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none rounded-xl bg-bg-deep transition-all duration-200",
                formFieldLabel: "text-text-secondary font-medium text-[13px] mb-2 block",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-text-tertiary px-2 bg-bg-base",
                footerActionText: "text-text-secondary",
                footerActionLink: "text-accent hover:text-accent-hover font-medium transition-colors",
                formFieldAction: "text-accent-secondary hover:text-violet-400 transition-colors",
                formFieldErrorText: "text-rose text-sm mt-1",
                alert: "bg-rose/10 border border-rose/20 text-rose p-3 rounded-xl mb-4",
                alertText: "text-rose text-sm",
                logoBox: "hidden",
                footer: "mt-8 text-center text-sm text-text-secondary",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
