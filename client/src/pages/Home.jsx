import { useUser, useClerk } from "@clerk/clerk-react";
// import api from "../services/api"; // If needed for dashboard data

const Home = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">AlgoPilot AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-300">Welcome, {user?.firstName || user?.username || 'User'}</span>
          <button 
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="p-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p>You are successfully authenticated!</p>
          <div className="mt-4">
             <p>User ID: {user?.id}</p>
             <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
