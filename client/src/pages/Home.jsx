import Hero from "../components/Hero"
import UpcomingTournaments from "../components/UpcomingTournaments"
import RecentResults from "../components/RecentResults"
import { Link, useNavigate } from "react-router-dom"
import Footer from "../components/Footer"

export default function Home() {
  const isLoggedIn = localStorage.getItem("contestantId")
  const playerName = localStorage.getItem("playerName")
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-black px-6">

      {/* Navigation Buttons */}
      <div className="flex justify-end py-4 gap-2">
        {isLoggedIn ? (
          <>
            <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold">
              👤 {playerName}
            </span>
            <Link to="/profile">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-2 rounded-lg font-semibold">
                Profile
              </button>
            </Link>
            <Link to="/wallet">
              <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold">
                Wallet
              </button>
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-semibold"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold">
                Register
              </button>
            </Link>
          </>
        )}
        <Link to="/admin">
          <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold">
            Admin
          </button>
        </Link>
      </div>

      {/* Hero Section */}
      <Hero />

      {/* Upcoming Tournaments */}
      <UpcomingTournaments textcolor="text-white" />

      {/* Recent Results */}
      <RecentResults />

      {/* About Section */}
      <div className="mt-20 text-center max-w-4xl mx-auto text-white mb-20">
        <h2 className="text-3xl font-bold mb-4 text-yellow-400">
          About BGMI Tournament
        </h2>

        <p className="text-gray-300 leading-relaxed">
          We organize daily BGMI tournaments with fair gameplay, instant room IDs,
          and fast prize distribution. Compete in Solo, Duo, or Squad matches
          with real players.
        </p>

        <p className="mt-4 text-gray-400">
          ✔ Trusted Admins &nbsp; ✔ Fast Payouts &nbsp; ✔ Anti-Cheat Matches
        </p>
      </div>

      <Footer />
    </div>
  )
}
