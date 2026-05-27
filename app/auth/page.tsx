import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🚗</div>
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="text-gray-500 text-sm mt-2">
          Save your quiz attempts and track your progress over time.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <AuthForm />
      </div>

      <p className="text-center text-sm text-gray-400 mt-6">
        Want to try without signing in?{" "}
        <Link href="/quiz" className="text-green-600 font-medium hover:underline">
          Start quiz as guest
        </Link>
      </p>
    </div>
  );
}
