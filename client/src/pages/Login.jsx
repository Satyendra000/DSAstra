import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const Login = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-deep relative overflow-hidden">
      {/* Ambient Gradient Orbs */}
      <div className="ambient-orb w-[500px] h-[500px] bg-accent/8 top-[-15%] left-[-10%] animate-float" />
      <div className="ambient-orb w-[400px] h-[400px] bg-accent-secondary/6 bottom-[-15%] right-[-10%]" style={{ animationDelay: '3s' }} />
      <div className="ambient-orb w-[200px] h-[200px] bg-accent/5 top-[40%] right-[20%]" style={{ animationDelay: '6s' }} />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="w-full max-w-md z-10 p-6 flex flex-col items-center animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shadow-lg glow-accent">
              <span className="material-symbols-outlined text-black text-[18px] font-bold">code</span>
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">DSAstra</span>
          </div>
          <p className="text-text-tertiary text-[12px] tracking-wide">AI-Powered DSA Mastery</p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#e2b340',
              colorBackground: '#111116',
              colorInputBackground: '#0a0a0e',
              colorInputText: '#ededef',
              colorText: '#ededef',
              colorTextSecondary: '#8a8f98',
              fontFamily: '"Inter", system-ui, sans-serif',
              borderRadius: '0.75rem',
            },
            elements: {
              card: "shadow-2xl border border-white/[0.06] p-8 m-0 w-full rounded-2xl bg-bg-elevated/80 backdrop-blur-xl",
              headerTitle: "text-2xl font-bold text-text-primary mb-2 text-center tracking-tight",
              headerSubtitle: "text-text-secondary text-sm text-center mb-6",
              socialButtonsBlockButton: "border border-white/[0.08] hover:bg-white/[0.05] bg-white/[0.02] text-text-primary transition-all duration-200 rounded-xl",
              socialButtonsBlockButtonText: "font-normal hidden md:block",
              formButtonPrimary: "font-semibold py-2.5 transition-all duration-200 text-black rounded-xl bg-accent hover:bg-accent-hover",
              formFieldInput: "border border-white/[0.08] focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none rounded-xl bg-bg-deep/50 transition-all duration-200",
              formFieldLabel: "text-text-secondary font-medium text-[13px]",
              dividerLine: "bg-white/[0.06]",
              dividerText: "text-text-tertiary px-2",
              footerActionText: "text-text-secondary",
              footerActionLink: "text-accent hover:text-accent-hover font-medium transition-colors",
              formFieldAction: "text-accent-secondary hover:text-violet-400 transition-colors",
              formFieldErrorText: "text-rose text-sm mt-1",
              alert: "bg-rose/10 border border-rose/20 text-rose p-3 rounded-xl",
              alertText: "text-rose text-sm",
              logoBox: "hidden",
              footer: "bg-transparent border-t border-white/[0.04] p-4",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            }
          }}
        />

        <div className="mt-10 text-center text-[11px] text-text-tertiary flex gap-6 justify-center">
          <a href="#" className="hover:text-text-secondary transition-colors duration-200">Privacy Policy</a>
          <a href="#" className="hover:text-text-secondary transition-colors duration-200">Terms of Service</a>
          <a href="#" className="hover:text-text-secondary transition-colors duration-200">Contact Support</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
