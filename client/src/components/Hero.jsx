import { Link } from "react-router-dom"
import banner from "../assets/bgmi-banner.jpg"
import soldier from "../assets/soldier.png"

export default function Hero() {
  const isLoggedIn = localStorage.getItem("contestantId")
  const playerName = localStorage.getItem("playerName")

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  return (
    <section
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center px-6 max-w-7xl mx-auto">
        {/* LEFT TEXT */}
        <div>
          <h1 className="text-4xl md:text-6xl text-white font-extrabold mb-4">
            DOMINATE THE BATTLEGROUND
          </h1>

          <p className="text-gray-300 mb-6">
            BGMI style tournaments • Real skill • Real prizes
          </p>

          {/* Social Icons with Highlighted Caption */}
          <div className="flex flex-col gap-3 mb-6">
<p className="text-white text-xl font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              🎮 FOR ALL THE LIVE STREAMS — SUBSCRIBE THIS CHANNEL! &nbsp;🔔 FOR ALL THE UPDATES — FOLLOW THIS ACCOUNT! 🎯
            </p>
            <div className="flex gap-6">
              <a href="https://www.youtube.com/channel/UC4qZgCA_-OEKlePzuauNbkw" target="_blank" rel="noopener noreferrer" title="YouTube Live">
                <svg className="w-12 h-12 text-red-600 hover:text-red-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.instagram.com/bgmirivalary?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" title="Instagram">
                <svg className="w-12 h-12 text-pink-600 hover:text-pink-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Register Button - Only show if not logged in */}
          {!isLoggedIn && (
            <Link to="/register">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                REGISTER NOW
              </button>
            </Link>
          )}

          {/* Show Profile & Logout if logged in */}
          {isLoggedIn && (
            <div className="flex gap-4">
              <Link to="/profile">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold">
                  👤 {playerName}
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* RIGHT IMAGE */}
        <div className="hidden md:block">
          <img
            src={soldier}
            alt="BGMI Soldier"
            className="w-[420px] drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  )
}
