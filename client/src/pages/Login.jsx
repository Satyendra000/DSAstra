import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const Login = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0f111a] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10 p-6 flex flex-col items-center">
        {/* Custom Logo Header above Clerk card */}
        <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
               <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-bold">A</div>
              <span className="text-xl font-bold text-white">DSAstra</span>
            </div>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#10b981', // emerald-500
              colorBackground: '#161b22', 
              colorInputBackground: '#0d1117',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              fontFamily: 'inherit',
              borderRadius: '0.5rem',
            },
            elements: {
              card: "shadow-2xl border border-gray-800 p-8 m-0 w-full",
              headerTitle: "text-2xl font-bold text-white mb-2 text-center",
              headerSubtitle: "text-gray-400 text-sm text-center mb-6",
              socialButtonsBlockButton: "border border-gray-700 hover:bg-gray-700 bg-[#1f2937] text-white transition-colors",
              socialButtonsBlockButtonText: "font-normal hidden md:block",
              formButtonPrimary: "font-semibold py-2.5 transition-colors text-black",
              formFieldInput: "border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none",
              formFieldLabel: "text-gray-300 font-medium",
              dividerLine: "bg-gray-700",
              dividerText: "text-gray-500 px-2",
              footerActionText: "text-gray-400",
              footerActionLink: "text-emerald-400 hover:text-emerald-300 font-medium",
              formFieldAction: "text-emerald-400 hover:text-emerald-300",
              formFieldErrorText: "text-red-500 text-sm mt-1",
              alert: "bg-red-500/10 border border-red-500 text-red-500 p-3 rounded",
              alertText: "text-red-500 text-sm",
              logoBox: "hidden", // Hide clerk logo, using our own
              footer: "bg-[#0d1117] border-t border-gray-800 p-4", // to match the image's bottom section
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            }
          }}
        />

        <div className="mt-8 text-center text-xs text-gray-500 flex gap-6 justify-center">
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Contact Support</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
