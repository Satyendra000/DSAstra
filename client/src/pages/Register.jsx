import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { dark } from "@clerk/themes";

const Register = () => {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 pl-24 relative overflow-hidden bg-[#0B1120]">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1e293b]/20 to-transparent pointer-events-none" />
         
         <div className="relative z-10 max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">A</div>
                <span className="text-xl font-bold text-white">DSAstra</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                Master Data<br />
                Structures &<br />
                Algorithms with AI.
            </h1>
            
            <p className="text-lg text-gray-400 mb-12 max-w-md">
                Join the next generation of developers using AI-driven insights to crack coding interviews and build better software.
            </p>

            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-900/30 text-blue-400">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Personalized Roadmaps</h3>
                        <p className="text-sm text-gray-500">Curriculums adapted to your skill level.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                     <div className="p-3 rounded-lg bg-purple-900/30 text-purple-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Real-time Battles</h3>
                        <p className="text-sm text-gray-500">Challenge peers in live coding duels.</p>
                    </div>
                </div>
                
                {/* AI Code Assistant Feature from screenshot */}
                <div className="flex items-start gap-4">
                     <div className="p-3 rounded-lg bg-indigo-900/30 text-indigo-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">AI Code Assistant</h3>
                        <p className="text-sm text-gray-500">Instant feedback on complexity and bugs.</p>
                    </div>
                </div>
            </div>
         </div>

         <div className="relative z-10 flex items-center gap-4 mt-12 max-w-lg">
             <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0c10] bg-gray-600" />
                 ))}
                 <div className="w-10 h-10 rounded-full border-2 border-[#0a0c10] bg-blue-600 flex items-center justify-center text-xs text-white font-bold">+2k</div>
             </div>
             <p className="text-sm text-gray-400">Joined by 2,000+ developers this week</p>
         </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#0B0F1A] relative">
         {/* Background glow for right side */}
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]" />
         
         <div className="w-full max-w-md z-10 relative">
            <div className="absolute top-0 right-0">
                {/* Close button placeholder */}
                <button className="text-gray-500 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <SignUp 
              routing="path" 
              path="/register"
              signInUrl="/login"
              fallbackRedirectUrl="/"
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#4f46e5', // indigo-600
                  colorBackground: 'transparent',
                  colorInputBackground: '#161b22', 
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#9ca3af',
                  fontFamily: 'inherit',
                  borderRadius: '0.5rem',
                },
                elements: {
                  card: "bg-transparent shadow-none p-0 w-full",
                  headerTitle: "text-3xl font-bold text-white mb-2",
                  headerSubtitle: "text-gray-400 mb-8",
                  socialButtonsBlockButton: "border border-gray-700 hover:bg-gray-700 bg-[#1f2937] text-white transition-colors",
                  socialButtonsBlockButtonText: "font-normal hidden md:block",
                  formButtonPrimary: "font-semibold py-3 transition-colors text-white",
                  formFieldInput: "w-full border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none",
                  formFieldLabel: "text-gray-300 font-medium",
                  dividerLine: "bg-gray-700",
                  dividerText: "text-gray-500 px-2 bg-[#0B0F1A]",
                  footerActionText: "text-gray-400",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300 font-medium",
                  formFieldAction: "text-indigo-400 hover:text-indigo-300",
                  formFieldErrorText: "text-red-500 text-sm mt-1",
                  alert: "bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4",
                  alertText: "text-red-500 text-sm",
                  logoBox: "hidden", // Hide clerk logo, using our own structure
                  footer: "mt-8 text-center text-sm text-gray-400",
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
